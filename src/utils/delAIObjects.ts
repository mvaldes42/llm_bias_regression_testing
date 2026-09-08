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
    try {
      await openai.files.delete(fileId)
      console.log(`File ${fileId} deleted`)
    } catch (error) {
      console.error(`Error deleting file ${fileId}`)
    }
  }
  if (vectorStoreId) {
    try {
      await openai.vectorStores.delete(vectorStoreId)
      console.log(`Vector store ${vectorStoreId} deleted`)
    } catch (error) {
      console.error(`Error deleting vector store ${vectorStoreId}`)
    }
  }
}
