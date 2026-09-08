import dotenv from 'dotenv'
import { testingScript } from './testingScript.ts'

async function main() {
  dotenv.config()

  const mode = process.env.MODE
  if (!mode) {
    console.error('Mode is required')
    process.exit(1)
  }
  if (mode !== 'real' && mode !== 'test') {
    console.error('Mode must be either real or test')
    process.exit(1)
  }

  let fromFile = false
  // If FROM_FILE is true, read from the existing files, otherwise create new files
  if (process.env.FROM_FILE) {
    fromFile = process.env.FROM_FILE === 'true' ? true : false
  }

  const promptBias = process.env.PROMPT_BIAS
  if (!promptBias) {
    console.error('Prompt bias is required')
    process.exit(1)
  }
  if (
    promptBias !== 'worse' &&
    promptBias !== 'better' &&
    promptBias !== 'neutral'
  ) {
    console.error('Prompt bias must be either worse, better, or neutral')
    process.exit(1)
  }

  await testingScript({ fromFile, mode, promptBias })
}

main()
