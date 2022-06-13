"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.androidlint = exports.PluginConfig = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const xml2js_1 = require("xml2js");
const defaultLintResultPath = 'app/build/reports/lint-results-debug.xml';
class PluginConfig {
}
exports.PluginConfig = PluginConfig;
async function androidlint(config = new PluginConfig()) {
    const dir = process.cwd();
    if (!(0, fs_1.existsSync)(`${dir}/gradlew`)) {
        fail('Could not found gradlew.');
        return;
    }
    // run android lint by gradle task
    if (config?.skipTask !== true) {
        const task = config?.task ?? 'lint';
        (0, child_process_1.execSync)(`${dir}/gradlew ${task}`);
    }
    // find lint-result.xml
    const path = config?.lintResultPath ?? defaultLintResultPath;
    const lintRaw = (0, fs_1.readFileSync)(`${dir}/${path}`, 'utf-8');
    if (lintRaw == null || lintRaw.length == 0) {
        fail('Could not found result file of lint.');
        return;
    }
    // parse xml to json
    const json = await (0, xml2js_1.parseStringPromise)(lintRaw, { mergeAttrs: true });
    const lintResult = json;
    // check file
    const editFiles = danger.git.modified_files.filter(element => !danger.git.deleted_files.includes(element));
    const createFiles = danger.git.created_files;
    const files = [...editFiles, ...createFiles];
    for (const issue of lintResult.issues.issue) {
        const location = issue.location[0];
        const filename = location.file[0].replace(`${dir}/`, '');
        if (!files.includes(filename)) {
            continue;
        }
        const line = location.line[0] != null ? parseInt(location.line[0]) : null;
        send(issue.severity[0], issue.message[0], filename, line);
    }
    function send(severity, messageText, file, line) {
        switch (severity) {
            case Severity.WARNING:
                warn(messageText, file, line);
                break;
            case Severity.INFORMATIONAL:
                message(messageText, file, line);
                break;
            case Severity.FATAL:
            case Severity.ERROR:
                warn(messageText, file, line);
                break;
            default:
            // nop
        }
    }
}
exports.androidlint = androidlint;
// https://www.javadoc.io/static/com.android.tools.lint/lint-api/25.3.0/com/android/tools/lint/detector/api/Severity.html
var Severity;
(function (Severity) {
    Severity["ERROR"] = "Error";
    Severity["FATAL"] = "Fatal";
    Severity["IGNORE"] = "Ignore";
    Severity["INFORMATIONAL"] = "Information";
    Severity["WARNING"] = "Warning";
})(Severity || (Severity = {}));
