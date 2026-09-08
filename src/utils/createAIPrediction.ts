import fs from 'fs'
import type OpenAI from 'openai'
import { RateLimitError } from 'openai'
import { DataType, PredictionType } from '../types.ts'
import { createOpenAIClient, responsesCall } from './responsesCall.ts'

const CONCURRENCY = 7
const MAX_RATE_LIMIT_RETRIES = 15

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createCooldown() {
  let until = 0

  return {
    async wait() {
      const wait = until - Date.now()
      if (wait > 0) {
        await sleep(wait)
      }
    },
    extend(ms: number) {
      until = Math.max(until, Date.now() + ms)
    },
  }
}

function retryAfterMs(error: RateLimitError): number {
  const fromMs = Number(error.headers.get('retry-after-ms'))
  if (Number.isFinite(fromMs) && fromMs >= 0) {
    return fromMs
  }

  const fromSeconds = Number(error.headers.get('retry-after'))
  if (Number.isFinite(fromSeconds) && fromSeconds >= 0) {
    return fromSeconds * 1000
  }

  return 1000
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) {
        return
      }
      results[index] = await fn(items[index])
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

function answerOption(text: string, value: number) {
  return {
    type: 'object',
    properties: {
      text: { type: 'string', enum: [text] },
      value: { type: 'integer', enum: [value] },
    },
    required: ['text', 'value'],
    additionalProperties: false,
  }
}

function bbqAnswerSchema(question: DataType) {
  return {
    type: 'object',
    properties: {
      answer: {
        anyOf: [
          answerOption(question.ans0, 0),
          answerOption(question.ans1, 1),
          answerOption(question.ans2, 2),
        ],
      },
    },
    required: ['answer'],
    additionalProperties: false,
  }
}

async function responsesCallWithRateLimit({
  client,
  prompt,
  schema,
  instructions,
  vectorStoreId,
  exampleId,
  cooldown,
}: {
  client: OpenAI
  prompt: string
  schema: ReturnType<typeof bbqAnswerSchema>
  instructions: string
  vectorStoreId: string | null
  exampleId: number
  cooldown: ReturnType<typeof createCooldown>
}): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    await cooldown.wait()
    try {
      const response = await responsesCall({
        client,
        prompt,
        schema,
        instructions,
        vectorStoreId: vectorStoreId || '',
      })
      if (!response) {
        console.error(`Empty response ${exampleId}`)
        return null
      }
      return response
    } catch (error) {
      const isLastAttempt = attempt === MAX_RATE_LIMIT_RETRIES
      if (!(error instanceof RateLimitError) || isLastAttempt) {
        console.error(error)
        return null
      }

      const waitMs = retryAfterMs(error) + 50
      cooldown.extend(waitMs)
      console.log(
        `Rate limited (TPM remaining=${error.headers.get('x-ratelimit-remaining-tokens')}). Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`,
      )
      await sleep(waitMs)
    }
  }

  return null
}

export async function createAIPredictions({
  data,
  predictionsPath,
  instructions,
  vectorStoreId,
}: {
  data: DataType[]
  predictionsPath: string
  instructions: string
  vectorStoreId: string | null
}): Promise<PredictionType[]> {
  const client = createOpenAIClient()
  const cooldown = createCooldown()

  const predictions = await mapPool(data, CONCURRENCY, async (question) => {
    const prompt = `${question.context} ${question.question} \n(a) ${question.ans0} (b) ${question.ans1} (c) ${question.ans2}`
    const response = await responsesCallWithRateLimit({
      client,
      prompt,
      schema: bbqAnswerSchema(question),
      instructions,
      vectorStoreId,
      exampleId: question.example_id,
      cooldown,
    })
    if (!response) {
      return null
    }

    const jsonResponse = JSON.parse(response)
    const prediction: PredictionType = {
      exampleId: question.example_id.toString(),
      contextCondition: question.context_condition,
      answer: jsonResponse.answer?.text,
      value: jsonResponse.answer?.value,
    }

    // Append so a later failure does not lose this item.
    // TODO: skip the API call if this example_id is already in the file.
    await fs.promises.appendFile(
      predictionsPath,
      JSON.stringify(prediction) + '\n',
    )

    return prediction
  })

  return predictions
    .filter((prediction): prediction is PredictionType => prediction != null)
    .sort((a, b) => parseInt(a.exampleId) - parseInt(b.exampleId))
}
