import OpenAI from "openai"

export function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-5-nano-2025-08-07"
}

export function createOpenAIClient(): OpenAI {
  return new OpenAI()
}

export async function responsesCall({
  client = new OpenAI(),
  input = "",
  options = { model: getModel() },
}: {
  client: OpenAI
  input: string
  options?: { model?: string }
}): Promise<string> {
  const response = await client.responses.create({
    model: options.model ?? getModel(),
    input,
    reasoning: { effort: "low" },
  })

  if (response.status !== "completed") {
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
