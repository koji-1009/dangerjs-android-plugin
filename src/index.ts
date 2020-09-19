// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare let danger: DangerDSLType

// Danger global functions
declare function fail(message: string, file?: string, line?: number): void
declare function warn(message: string, file?: string, line?: number): void
declare function message(message: string, file?: string, line?: number): void

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { parseStringPromise } from 'xml2js'

export class PluginConfig {
    skipTask = false
    task: string = null
    lintResultPath = 'app/build/reports/lint/lint-result.xml'
}

export async function androidlint(config: PluginConfig = new PluginConfig()): Promise<void> {
    const dir = process.cwd()
    if (!existsSync(`${dir}/gradlew`)) {
        fail('Could not found gradlew.')
        return
    }

    // run android lint by gradle task
    if (config?.skipTask !== true) {
        const task = config?.task ?? 'lint'
        execSync(`${dir}/gradlew ${task}`)
    }

    // find lint-result.xml
    const path = config?.lintResultPath
    const lintRaw = readFileSync(`${dir}/${path}`, 'utf-8')
    if (lintRaw == null || lintRaw.length == 0) {
        fail('Could not found result file of lint.')
        return
    }

    // parse xml to json
    const json = await parseStringPromise(lintRaw)
    const issues: Issues = Object.assign({}, json)

    // check file
    const editFiles = danger.git.modified_files.filter(element => !danger.git.deleted_files.includes(element))
    const createFiles = danger.git.created_files
    const files = [...editFiles, ...createFiles]

    issues.issues.forEach(issue => {
        const location = issue.location
        const filename = (location.file).replace(`${dir}/`, '')
        if (!files.includes(filename)) {
            return
        }

        const line = parseInt(location['line'] ?? '0')
        send(issue.severity, issue.message, filename, line)
    })

    function send(severity: string, messageText: string, file: string, line: number) {
        switch (severity) {
            case Severity.WARNING:
                warn(messageText, file, line)
                break
            case Severity.INFORMATIONAL:
                message(messageText, file, line)
                break
            case Severity.FATAL:
            case Severity.ERROR:
                fail(messageText, file, line)
                break
            default:
            // nop
        }
    }
}

interface Issues {
    issues: [Issue]
}

interface Issue {
    id: string
    severity: string
    message: string
    category: string
    priority: string
    summary: string
    explanation: string
    includedVariants: string
    excludedVariants: string
    url: string
    urls: string
    errorLine1: string
    errorLine2: string
    location: Location
}

interface Location {
    file: string
    line: string
    column: string
}

// https://www.javadoc.io/static/com.android.tools.lint/lint-api/25.3.0/com/android/tools/lint/detector/api/Severity.html
enum Severity {
    ERROR = 'Error',
    FATAL = 'Fatal',
    IGNORE = 'Ignore',
    INFORMATIONAL = 'Information',
    WARNING = 'Warning',
}

