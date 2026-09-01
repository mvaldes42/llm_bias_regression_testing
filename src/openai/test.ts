import { responsesCall, createOpenAIClient } from './client.ts'

const client = createOpenAIClient()
const text = await responsesCall({ client, input: 'Reply with exactly: ok' })

console.log(text)
