"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const configuration_1 = require("../configuration");
const generator_1 = require("../generator");
class App {
    constructor() {
        this.program = commander;
        this.package = require('../../../package.json');
    }
    initialize() {
        this.program
            .version(this.package.version)
            .description('An application for creating files from templates')
            .option('-c, --config-file [value]', 'Set configuration file name (without .json) default will be appig.json')
            .option('-r, --rule [value]', 'Will limit generation to one rule within the config file ' +
            'if the name of the role is given here | ' +
            'all will process all rules | ' +
            '{keyword}:* will process all rules that start with {keyword}')
            .option('-t, --target [value]', 'Set target directory which is to top relative directory of ' +
            'each rule (./ is used as default)')
            .option('-d, --config-directory [value]', 'The directory containing the config files (./ is used as default)')
            .parse(process.argv);
    }
    run() {
        let directory, filePath, rule, target;
        directory = this.program.configDirectory || process.cwd();
        filePath = this.program.configFile || null;
        rule = this.program.rule;
        target = this.program.target || null;
        this.configuration = new configuration_1.Configuration(directory, filePath);
        if (this.configuration.error) {
            return this.logError(this.configuration.error);
        }
        this.generator = new generator_1.Generator({ config: this.configuration, rule: rule, target: target });
        if (this.generator.error) {
            return this.logError(this.generator.error);
        }
        this.generator.generate(err => {
            if (err) {
                return this.logError(err);
            }
            console.log('DONE');
        });
    }
    logError(err) {
        console.error(err);
    }
}
exports.App = App;
let app = new App();
app.initialize();
app.run();
//# sourceMappingURL=app.js.map