import path from 'path'

export function generalPaths(directory: string) {
  return {
    finalScorePath: path.join(
      directory,
      `../results/test/final_results_score.jsonl`,
    ),
    additionalMetadataPath: path.join(
      directory,
      `../data/additionalMetadata.csv`,
    ),
  }
}

export function getCategoryPaths({
  category,
  directory,
}: {
  category: string
  directory: string
}) {
  const currentCategoryDataPath = path.join(
    directory,
    `../data/test/${category}.jsonl`,
  )
  const combinedDataPath = path.join(
    directory,
    `../results/test/${category}_combined_data.jsonl`,
  )
  const predictionsPath = path.join(
    directory,
    `../results/test/${category}_predictions.jsonl`,
  )
  console.log('currentCategoryDataPath is: ', currentCategoryDataPath)
  console.log('combinedDataPath is: ', combinedDataPath)
  console.log('predictionsPath is: ', predictionsPath)

  return {
    currentCategoryDataPath,
    combinedDataPath,
    predictionsPath,
  }
}
