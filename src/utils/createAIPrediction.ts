import fs from 'fs'
import type OpenAI from 'openai'
import { RateLimitError } from 'openai'
import {
  DataType,
  ModeType,
  PredictionType,
  ResponsesCallResult,
} from '../types.ts'
import {
  CONCURRENCY,
  createCooldown,
  mapPool,
  MAX_RATE_LIMIT_RETRIES,
  retryAfterMs,
  sleep,
} from './rateLimitsUtils.ts'
import {
  createOpenAIClient,
  measuresRag,
  responsesCall,
} from './responsesCall.ts'

function getPrompt({ question }: { question: DataType }): string {
  return `${question.context} ${question.question} \n(a) ${question.ans0} (b) ${question.ans1} (c) ${question.ans2}`
}

function answerOption({ text, value }: { text: string; value: number }) {
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

function bbqAnswerSchema({ question }: { question: DataType }) {
  return {
    type: 'object',
    properties: {
      answer: {
        anyOf: [
          answerOption({ text: question.ans0, value: 0 }),
          answerOption({ text: question.ans1, value: 1 }),
          answerOption({ text: question.ans2, value: 2 }),
        ],
      },
      reason: { type: 'string' },
    },
    required: ['answer', 'reason'],
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
}): Promise<ResponsesCallResult | null> {
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
  mode,
}: {
  data: DataType[]
  predictionsPath: string
  instructions: string
  vectorStoreId: string | null
  mode: ModeType
}): Promise<PredictionType[]> {
  const client = createOpenAIClient()
  const cooldown = createCooldown()

  const predictions = await mapPool(data, CONCURRENCY, async (question) => {
    const prompt = getPrompt({ question })

    const response = await responsesCallWithRateLimit({
      client,
      prompt,
      schema: bbqAnswerSchema({ question }),
      instructions,
      vectorStoreId,
      exampleId: question.example_id,
      cooldown,
    })
    if (!response) {
      return null
    }

    const jsonResponse = JSON.parse(response.text)
    const prediction: PredictionType = {
      exampleId: question.example_id.toString(),
      contextCondition: question.context_condition,
      answer: jsonResponse.answer?.text,
      value: jsonResponse.answer?.value,
      measuresRag: measuresRag({ files: response.files }),
      reason: jsonResponse.reason,
    }

    console.log('prediction: ', prediction)

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
