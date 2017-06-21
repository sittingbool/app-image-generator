"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_processor_1 = require("./image-processor");
const contents_json_updater_1 = require("./contents-json-updater");
const sb_util_ts_1 = require("sb-util-ts");
const base_controller_1 = require("./base-controller");
const path = require("path");
const _ = require("lodash");
const validator_1 = require("./validator");
class Generator extends base_controller_1.BaseController {
    constructor(options) {
        super();
        this.contentFileUpdater = new contents_json_updater_1.ContentsFileUpdater();
        this.setupWithOptions(options);
    }
    setupWithOptions(options) {
        let rootPath;
        if (sb_util_ts_1.stringIsEmpty(options.rule)) {
            return this.setError('No configuration rule set, can not continue');
        }
        this.configuration = options.config;
        if (options.rule.toLowerCase() === 'all') {
            this.rules = this.configuration.configForAllRules();
        }
        else if (/^([\w])\w+(:\*)/.test(options.rule)) {
            this.rules = this.configuration.configForGenericRules(options.rule);
        }
        else {
            this.rules = [this.configuration.configForRule(options.rule)];
        }
        this.rules = this.rules.filter(item => {
            return validator_1.Validator.ruleIsValid(item);
        });
        if (this.rules.length < 1) {
            return this.setError('Invalid rule found for ' + options.rule + ', please check configuration');
        }
        rootPath = this.configuration.getGeneratorConfig().rootPath;
        if (!sb_util_ts_1.stringIsEmpty(rootPath)) {
            if (!rootPath.startsWith('/')) {
                rootPath = path.join(process.cwd(), rootPath);
            }
        }
        else {
            rootPath = process.cwd();
        }
        if (!sb_util_ts_1.stringIsEmpty(options.target)) {
            this.target = options.target;
            if (!this.target.startsWith('/')) {
                this.target = path.join(rootPath, this.target);
            }
        }
        else {
            this.target = rootPath;
        }
    }
    generate(callback) {
        let rule;
        if (this.rules.length < 1) {
            return callback(null);
        }
        rule = this.rules.shift();
        this.generateImagesFromRule(rule, err => {
            if (err) {
                return callback(err);
            }
            this.generate(callback);
        });
    }
    generateImagesFromRule(rule, callback) {
        let image, original, target;
        if (rule.images.length < 1) {
            return callback(null);
        }
        if (rule.sourceFiles && Array.isArray(rule.sourceFiles) && rule.sourceFiles.length > 0) {
            return this.generateImagesFromRuleWithManySources(rule, callback);
        }
        image = rule.images.shift();
        original = path.join(this.configuration.directory, rule.sourceFile);
        target = path.join(this.target, image.targetPath, image.fileName);
        if (!sb_util_ts_1.stringIsEmpty(rule._targetVar)) {
            target = target.replace('{source}', rule._targetVar);
        }
        target = this.applyReplacementsInTargetName(target, image.replaceInTargetName);
        this.generateImageWithOptions({
            original: original,
            target: target,
            size: image.size,
            noCrop: image.noCrop,
            fillColor: image.fillColor,
            colorize: image.colorize,
            compose: image.compose
        }, rule, callback);
    }
    applyReplacementsInTargetName(targetName, replacements) {
        if (replacements && typeof replacements === 'object') {
            Object.keys(replacements).forEach(search => {
                let val = replacements[search];
                if (typeof val === 'string') {
                    targetName = targetName.replace(search, val);
                }
            });
        }
        return targetName;
    }
    generateImageWithOptions(options, rule, callback) {
        let process = new image_processor_1.ImageProcess(options);
        process.run(err => {
            if (err) {
                return callback(err);
            }
            this.generateImagesFromRule(rule, callback);
        });
    }
    generateImagesFromRuleWithManySources(rule, callback) {
        let sources = rule.sourceFiles, current, runner, images = rule.images;
        rule.sourceFiles = null;
        runner = () => {
            let fileName;
            if (sources.length < 1) {
                return callback(null);
            }
            current = sources.shift();
            rule.sourceFile = current;
            fileName = path.basename(current);
            fileName = fileName.replace(path.extname(current), '');
            rule._targetVar = fileName;
            rule.images = _.clone(images);
            this.generateImagesFromRule(rule, (err) => {
                if (err) {
                    return callback(err);
                }
                runner();
            });
        };
        runner();
    }
}
exports.Generator = Generator;
//# sourceMappingURL=generator.js.map