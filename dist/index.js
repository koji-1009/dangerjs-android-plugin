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
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const xml2js_1 = require("xml2js");
function android(config) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const isGradleExist = child_process_1.execSync('ls gradlew').buffer.byteLength != 0;
        if (!isGradleExist) {
            fail('Could not found gradlew.');
            return;
        }
        // run android lint by gradle task
        if ((config === null || config === void 0 ? void 0 : config.skipTask) !== true) {
            const task = (_a = config === null || config === void 0 ? void 0 : config.task) !== null && _a !== void 0 ? _a : 'lint';
            child_process_1.execSync(`gradlew ${task}`);
        }
        // find lint-result.xml
        const path = (_b = config === null || config === void 0 ? void 0 : config.lintResultPath) !== null && _b !== void 0 ? _b : 'app/build/reports/lint/lint-result.xml';
        const lintRaw = fs_1.readFileSync(path, 'utf-8');
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
        const dir = process.env.PWD;
        issues.issues.forEach(issue => {
            var _a;
            const location = issue.location;
            const filename = (location.file).replace(dir, '');
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
exports.default = android;
// https://www.javadoc.io/static/com.android.tools.lint/lint-api/25.3.0/com/android/tools/lint/detector/api/Severity.html
var Severity;
(function (Severity) {
    Severity["ERROR"] = "Error";
    Severity["FATAL"] = "Fatal";
    Severity["IGNORE"] = "Ignore";
    Severity["INFORMATIONAL"] = "Information";
    Severity["WARNING"] = "Warning";
})(Severity || (Severity = {}));