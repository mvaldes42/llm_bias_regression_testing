import path from 'path'
import { ModeType } from '../types.ts'

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
  mode,
}: {
  category: string
  directory: string
  outputDir: string
  mode?: ModeType
}) {
  const dataFile =
    mode === 'real' && category === 'Gender_identity'
      ? 'Gender_identity_recruiting.jsonl'
      : `${category}.jsonl`
  const currentCategoryDataPath = path.join(
    directory,
    `../data/test/${dataFile}`,
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
