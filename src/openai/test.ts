import { responsesCall, createOpenAIClient, getModel } from "./client.ts"

const client = createOpenAIClient()
const text = await responsesCall({ client, input: "Reply with exactly: ok" })

console.log(`model=${getModel()}`)
console.log(text)
