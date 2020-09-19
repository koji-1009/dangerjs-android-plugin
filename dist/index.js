"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.androidlint = exports.PluginConfig = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const xml2js_1 = require("xml2js");
class PluginConfig {
    constructor() {
        this.skipTask = false;
        this.task = null;
        this.lintResultPath = 'app/build/reports/lint/lint-result.xml';
    }
}
exports.PluginConfig = PluginConfig;
function androidlint(config = null) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const dir = process.cwd();
        console.log(`dir: ${dir}`);
        if (!fs_1.existsSync(`${dir}/gradlew`)) {
            fail('Could not found gradlew.');
            return;
        }
        // run android lint by gradle task
        if ((config === null || config === void 0 ? void 0 : config.skipTask) !== true) {
            const task = (_a = config === null || config === void 0 ? void 0 : config.task) !== null && _a !== void 0 ? _a : 'lint';
            child_process_1.execSync(`${dir}/gradlew ${task} --no-deamon`);
        }
        // find lint-result.xml
        const path = config === null || config === void 0 ? void 0 : config.lintResultPath;
        const lintRaw = fs_1.readFileSync(`${dir}/${path}`, 'utf-8');
        if (lintRaw == null || lintRaw.length == 0) {
            fail('Could not found result file of lint.');
            return;
        }
        // parse xml to json
        const json = yield xml2js_1.parseStringPromise(lintRaw);
        const issues = Object.assign({}, json);
        // check file
        const editFiles = danger.git.modified_files.filter(element => !danger.git.deleted_files.includes(element));
        const createFiles = danger.git.created_files;
        const files = [...editFiles, ...createFiles];
        issues.issues.forEach(issue => {
            var _a;
            const location = issue.location;
            const filename = (location.file).replace(`${dir}/`, '');
            if (!files.includes(filename)) {
                return;
            }
            const line = parseInt((_a = location['line']) !== null && _a !== void 0 ? _a : '0');
            send(issue.severity, issue.message, filename, line);
        });
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
                    fail(messageText, file, line);
                    break;
                default:
                // nop
            }
        }
    });
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
