import { responsesCall, createOpenAIClient } from './client.ts'
import fs from 'fs'
import path from 'path'

const client = createOpenAIClient()

const data = fs.readFileSync(
  path.join(import.meta.dirname, '../../data/test/Age.jsonl'),
  'utf8',
)
const dataList = data.split('\n').map((line) => JSON.parse(line))

const responses = await Promise.all(
  dataList.map(async (question) => {
    // create the ARC prompt : context + question + \n + '(a)' + ans0 + '(b)' + ans1 + '(c)' + ans2
    const prompt = `${question.context} ${question.question} \n(a) ${question.ans0} (b) ${question.ans1} (c) ${question.ans2}`
    const schema = {
      type: 'object',
      properties: {
        answer: {
          anyOf: [
            {
              type: 'object',
              properties: {
                text: { type: 'string', enum: [question.ans0] },
                value: { type: 'integer', enum: [0] },
              },
              required: ['text', 'value'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                text: { type: 'string', enum: [question.ans1] },
                value: { type: 'integer', enum: [1] },
              },
              required: ['text', 'value'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                text: { type: 'string', enum: [question.ans2] },
                value: { type: 'integer', enum: [2] },
              },
              required: ['text', 'value'],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ['answer'],
      additionalProperties: false,
    }
    let response = await responsesCall({ client, prompt, schema })

    return response
  }),
)

console.log(responses)

const resultsPath = path.join(
  import.meta.dirname,
  '../../results/test/Age_results.jsonl',
)
if (!fs.existsSync(resultsPath)) {
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true })
  fs.writeFileSync(resultsPath, '')
} else {
  fs.writeFileSync(resultsPath, '')
}

fs.writeFileSync(resultsPath, responses.join('\n'))
