import logger from '../logger'

export interface Fail {
  message: string
  details?: string
  logs?: string[]
}

export interface Pass {
  message: string
  logs?: string[]
}

export interface ParserOutput {
  ok: boolean
  passed: Pass[]
  failed: Fail[]
  logs: string[]
  summary: { [key: string]: boolean }
}

const r = {
  start: /^1\.\.[0-9]+$/,
  fail: /^not ok \d+\s(\-\s)?(.+)+$/,
  pass: /^ok \d+\s(\-\s)?(.+)+$/,
  details: /^#\s{2}(.+)$/,
  ignore: /^#\s+(tests|pass|fail|skip)\s+[0-9]+$/,
}

const detect = (type: 'fail' | 'pass' | 'details', text: string) => r[type].exec(text)

const parser = (text: string): ParserOutput => {
  const lineList = text.split('\n')
  // start after 1..n output
  const startingPoint = lineList.findIndex((t) => t.match(r.start))
  const lines = lineList.slice(startingPoint + 1)

  const result: ParserOutput = {
    ok: true,
    passed: [],
    failed: [],
    logs: [],
    summary: {},
  }

  // temporary holder of error detail strings
  let currentDetails: string | null = null
  let logs: string[] = []

  const addCurrentDetails = () => {
    const failLength: number = result.failed.length
    if (currentDetails && !!failLength) {
      result.failed[failLength - 1].details = currentDetails
      currentDetails = null
    }
  }

  for (const line of lines) {
    if (!line.length) {
      continue
    }
    // be optimistic! check for success
    const isPass = detect('pass', line)
    if (!!isPass) {
      const message = isPass[2].trim()
      const pass: Pass = { message }
      if (logs.length) {
        pass.logs = logs
        logs = []
      }
      result.passed.push(pass)
      result.summary[message] = true
      addCurrentDetails()
      continue
    }

    // check for failure
    const isFail = detect('fail', line)
    if (!!isFail) {
      result.ok = false
      addCurrentDetails()
      const message = isFail[2].trim()
      const fail: Fail = { message }
      if (logs.length) {
        fail.logs = logs
        logs = []
      }
      result.failed.push(fail)
      result.summary[message] = false
      continue
    }

    // check for error details
    const isDetails = detect('details', line)
    if (!!isDetails) {
      const lineDetails: string = isDetails[1].trim()
      if (!currentDetails) {
        currentDetails = lineDetails
      } else {
        currentDetails += `\n${lineDetails}`
      }
      continue
    }

    if (!r.ignore.exec(line)) {
      // must be a log, associate with the next test
      logs.push(line)
      result.logs.push(line)
    }
  }
  addCurrentDetails()
  return result
}

export default parser
