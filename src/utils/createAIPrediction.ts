import { responsesCall, createOpenAIClient } from './responsesCall.ts'
import fs from 'fs'
import { DataType, PredictionType } from '../types.ts'

export async function createAIPredictions({
  data,
  predictionsPath,
}: {
  data: DataType[]
  predictionsPath: string
}): Promise<PredictionType[]> {
  const client = createOpenAIClient()

  const predictions = await Promise.all(
    data.map(async (question) => {
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
      const response = await responsesCall({ client, prompt, schema })
      const jsonResponse = JSON.parse(response)

      const prediction = {
        exampleId: question.example_id.toString(),
        contextCondition: question.context_condition,
        answer: jsonResponse.answer?.text,
        value: jsonResponse.answer?.value,
      }

      // Append to the results file to avoid rerunning for all the questions if one fails
      //TODO: before the api call, check if the  entry in the file already exists and if it does, skip the question
      fs.promises.appendFile(predictionsPath, JSON.stringify(prediction) + '\n')

      return prediction
    }),
  )

  predictions.sort((a, b) => parseInt(a.exampleId) - parseInt(b.exampleId))
  return predictions
}
