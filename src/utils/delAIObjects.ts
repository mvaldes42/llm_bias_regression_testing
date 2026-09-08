import OpenAI from 'openai'

export async function delAIObjects({
  vectorStoreId,
  filesIds,
}: {
  vectorStoreId: string | null
  filesIds: string[]
}) {
  const openai = new OpenAI()

  for (const fileId of filesIds) {
    await openai.files.delete(fileId)
  }
  if (vectorStoreId) {
    await openai.vectorStores.delete(vectorStoreId)
  }
}
