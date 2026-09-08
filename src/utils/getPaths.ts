import path from 'path'

export function generalPaths({
  directory,
  outputDir,
}: {
  directory: string
  outputDir: string
}) {
  return {
    finalScorePath: path.join(
      directory,
      `../results/${outputDir}/final_results_score.jsonl`,
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
  outputDir,
}: {
  category: string
  directory: string
  outputDir: string
}) {
  // todo: link to data/categories when not in test mode
  const currentCategoryDataPath = path.join(
    directory,
    `../data/test/${category}.jsonl`,
  )
  const combinedDataPath = path.join(
    directory,
    `../results/${outputDir}/${category}_combined_data.jsonl`,
  )
  const predictionsPath = path.join(
    directory,
    `../results/${outputDir}/${category}_predictions.jsonl`,
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
