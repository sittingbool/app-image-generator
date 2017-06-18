"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const sb_util_ts_1 = require("sb-util-ts");
const base_controller_1 = require("./base-controller");
class GeneratorRule {
    constructor() {
        this.name = "";
        this.sourceFile = null;
        this.images = [];
    }
    static withConfig(config) {
        let instance = new this();
        Object.keys(config).forEach(key => {
            instance[key] = config[key];
        });
        if (!instance.images || !Array.isArray(instance.images)) {
            instance.images = [];
        }
        return instance;
    }
}
exports.GeneratorRule = GeneratorRule;
class Configuration extends base_controller_1.BaseController {
    constructor(directory, fileName) {
        super();
        this.configPath = null;
        this.error = null;
        this.setupPath(directory, fileName);
        this.loadConfig();
    }
    setupPath(directory, fileName) {
        let stat;
        if (!directory) {
            return this.setError('No directory given');
        }
        if (!directory.startsWith('/')) {
            directory = path.join(process.cwd(), directory);
        }
        if (!fs.existsSync(directory)) {
            return this.setError('No such directory: ' + directory);
        }
        try {
            stat = fs.lstatSync(directory);
        }
        catch (err) {
            return this.setError(err.message);
        }
        if (!stat.isDirectory()) {
            return this.setError('The path: ' + directory + ' is not a directory');
        }
        this.directory = directory;
        if (!fileName || sb_util_ts_1.stringIsEmpty(fileName)) {
            fileName = 'appig.json';
        }
        this.configPath = path.join(directory, fileName);
        if (!this.configPath.endsWith('.json')) {
            if (!fs.existsSync(this.configPath)) {
                if (fs.existsSync(this.configPath + '.json')) {
                    this.configPath += '.json';
                }
            }
        }
        try {
            stat = fs.lstatSync(this.configPath);
        }
        catch (err) {
            return this.setError(err.message);
        }
        if (!stat.isFile()) {
            return this.setError('The path: ' + this.configPath + ' is not a file');
        }
    }
    loadConfig() {
        if (this.error) {
            return;
        }
        let fileData = fs.readFileSync(this.configPath, 'utf8');
        try {
            this.config = JSON.parse(fileData);
        }
        catch (err) {
            return this.setError(err.message);
        }
    }
    configForRule(rule) {
        let defaultRule = new GeneratorRule();
        if (sb_util_ts_1.stringIsEmpty(rule) || this.error || !this.config.rules ||
            typeof this.config.rules !== 'object' || typeof this.config.rules[rule] !== 'object') {
            return defaultRule;
        }
        return GeneratorRule.withConfig(this.config.rules[rule]) || defaultRule;
    }
    configForGenericRules(ruleBeginning) {
        let rules = [], keys;
        if (sb_util_ts_1.stringIsEmpty(ruleBeginning) || this.error || !this.config.rules ||
            typeof this.config.rules !== 'object') {
            return rules;
        }
        if (ruleBeginning.endsWith('*')) {
            ruleBeginning = ruleBeginning.substring(0, ruleBeginning.length - 1).trim();
            if (sb_util_ts_1.stringIsEmpty(ruleBeginning)) {
                return rules;
            }
        }
        keys = Object.keys(this.config.rules).filter(item => {
            return item.startsWith(ruleBeginning);
        });
        keys.forEach(item => {
            rules.push(this.config.rules[item]);
        });
        return rules;
    }
    configForAllRules() {
        let rules = [];
        if (this.error || !this.config.rules || typeof this.config.rules !== 'object') {
            return rules;
        }
        Object.keys(this.config.rules).forEach(key => {
            rules.push(this.config.rules[key]);
        });
        return rules;
    }
    getGeneratorConfig() {
        if (this.error || !this.config.options || typeof this.config.options !== 'object') {
            return {};
        }
        return this.config.options;
    }
}
exports.Configuration = Configuration;
//# sourceMappingURL=configuration.js.map