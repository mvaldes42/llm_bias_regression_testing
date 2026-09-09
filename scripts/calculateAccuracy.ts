import { CombinedDataType, FinalScoreType } from '../src/types.ts'

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function calculateAccuracy(combinedData: CombinedDataType[]): number | null {
  if (combinedData.length === 0) {
    return null
  }
  let totalScore = 0
  for (const data of combinedData) {
    if (data.prediction && data.prediction.value === data.label) {
      totalScore++
    }
  }
  return round3(totalScore / combinedData.length)
}

// accuracy = Share of rows with `pred_label == label`.
// Split by context_condition so you get acc_ambig and acc_disambig
export function calculateAccuracyScore({
  combinedData,
}: {
  combinedData: CombinedDataType[]
}): Omit<FinalScoreType, 'scoreDisambig' | 'scoreAmbig' | 'nScored'> {
  const accAmbig = calculateAccuracy(
    combinedData.filter((d) => d.context_condition === 'ambig'),
  )
  const accDisambig = calculateAccuracy(
    combinedData.filter((d) => d.context_condition === 'disambig'),
  )
  const accTotal =
    accAmbig == null || accDisambig == null
      ? null
      : round3((accAmbig + accDisambig) / 2)

  return {
    accAmbig,
    accDisambig,
    accTotal,
  }
}
