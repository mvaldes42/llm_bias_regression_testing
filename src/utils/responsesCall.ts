import OpenAI from 'openai'

export function createOpenAIClient(): OpenAI {
  return new OpenAI()
}

export async function responsesCall({
  client = new OpenAI(),
  prompt,
  schema,
  instructions,
  vectorStoreId,
}: {
  client: OpenAI
  prompt: string
  schema: any
  instructions: string
  vectorStoreId: string | null
}): Promise<string | null> {
  const response = await client.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    instructions,
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
    tools: vectorStoreId
      ? [
          {
            type: 'file_search',
            vector_store_ids: [vectorStoreId],
            max_num_results: 20,
          },
        ]
      : [],
  })

  if (response.status !== 'completed') {
    console.error(
      `Responses API did not complete (status=${response.status}, id=${response.id})`,
    )
    return null
  }

  const fileSearchQueries = response.output.find(
    (output) => output.type === 'file_search_call',
  )?.queries
  if (fileSearchQueries) {
    console.log('fileSearchQueries: ', fileSearchQueries)
  }

  const text = response.output_text?.trim()
  if (!text) {
    console.error(`Empty output_text (id=${response.id})`)
    return null
  }

  return text
}
