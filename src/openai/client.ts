import OpenAI from 'openai'

export function createOpenAIClient(): OpenAI {
  return new OpenAI()
}

export async function responsesCall({
  client = new OpenAI(),
  input = '',
}: {
  client: OpenAI
  input: string
}): Promise<string> {
  const response = await client.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    input,
    reasoning: { effort: 'low' },
  })

  if (response.status !== 'completed') {
    throw new Error(
      `Responses API did not complete (status=${response.status}, id=${response.id})`,
    )
  }

  const text = response.output_text?.trim()
  if (!text) {
    throw new Error(`Empty output_text (id=${response.id})`)
  }

  return text
}
