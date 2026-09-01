import OpenAI from 'openai'

export function createOpenAIClient(): OpenAI {
  return new OpenAI()
}

export async function responsesCall({
  client = new OpenAI(),
  prompt,
  schema,
}: {
  client: OpenAI
  prompt: string
  schema: any
}): Promise<string> {
  const response = await client.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    input: prompt,
    reasoning: { effort: 'low' },
    text: {
      format: {
        type: 'json_schema',
        name: 'bbq_answer',
        strict: true,
        schema,
      },
    },
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
