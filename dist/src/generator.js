"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sb_util_ts_1 = require("sb-util-ts");
const base_controller_1 = require("./base-controller");
const path = require("path");
const fs = require("fs");
const gm = require("gm");
const mkdirp = require("mkdirp");
const _ = require("lodash");
const hex2rgb = require("hex-rgb");
class Generator extends base_controller_1.BaseController {
    constructor(options) {
        super();
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
            return this.ruleIsValid(item);
        });
        if (this.rules.length < 1) {
            return this.setError('No valid rule found for ' + options.rule + ', please check configuration');
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
    ruleIsValid(rule) {
        return (rule && typeof rule === 'object' &&
            (!sb_util_ts_1.stringIsEmpty(rule.sourceFile) ||
                (Array.isArray(rule.sourceFiles) && rule.sourceFiles.length)) &&
            Array.isArray(rule.images) && rule.images.length > 0 && this.ruleImagesAreValid(rule.images));
    }
    ruleImagesAreValid(image) {
        let i, current;
        if (Array.isArray(image)) {
            for (i = 0; i < image.length; i++) {
                current = image[i];
                if (!this.ruleImagesAreValid(current)) {
                    return false;
                }
            }
            return true;
        }
        return (image && typeof image === 'object' && !sb_util_ts_1.stringIsEmpty(image.targetPath) &&
            !sb_util_ts_1.stringIsEmpty(image.size) &&
            /^([0-9])+x([0-9])+$/.test(image.size) &&
            !sb_util_ts_1.stringIsEmpty(image.fileName));
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
            colorize: image.colorize
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
        let process = new ImageProcess(options);
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
class ImageProcess {
    constructor(options) {
        this.options = null;
        this.optionalsUsed = false;
        let sizing;
        sizing = options.size.split('x');
        this.options = _.clone(options);
        this.width = parseInt(sizing[0]);
        this.height = parseInt(sizing[1]);
    }
    run(callback) {
        let dir;
        if (!fs.existsSync(this.options.original)) {
            return callback('No such file: ' + this.options.original);
        }
        if (!fs.lstatSync(this.options.original).isFile()) {
            return callback('Is not a file: ' + this.options.original);
        }
        dir = path.dirname(this.options.target);
        mkdirp(dir, (err) => {
            if (err) {
                return callback(err.message);
            }
            if (fs.existsSync(this.options.target)) {
                fs.unlinkSync(this.options.target);
            }
            if (this.options.noCrop) {
                return this.runWithOutCrop(callback);
            }
            this.runWithCrop(callback);
        });
    }
    runWithCrop(callback) {
        let relativeWidth, relativeHeight, process;
        console.log('Processing: ' + this.options.original + ' -> ' + this.options.target);
        gm(this.options.original)
            .size((err, size) => {
            if (err) {
                return callback(err.message);
            }
            if (size.width < this.width) {
                relativeWidth = size.width;
                relativeHeight = (size.width / this.width) * this.height;
                if (relativeHeight > size.height) {
                    relativeWidth = (size.height / relativeHeight) * relativeWidth;
                    relativeHeight = size.height;
                }
            }
            else if (size.height < this.height) {
                relativeHeight = size.height;
                relativeWidth = (size.height / this.height) * this.width;
                if (relativeWidth > size.width) {
                    relativeHeight = (size.width / relativeWidth) * relativeHeight;
                    relativeWidth = size.width;
                }
            }
            else if (size.width / this.width > size.height / this.height) {
                relativeHeight = size.height;
                relativeWidth = (this.width / this.height) * relativeHeight;
            }
            else {
                relativeWidth = size.width;
                relativeHeight = (this.height / this.width) * relativeWidth;
            }
            if (relativeWidth > size.width || relativeHeight > size.height) {
                return callback('Relative sizes miscalculation');
            }
            process = gm(this.options.original)
                .gravity('Center')
                .crop('' + relativeWidth, '' + relativeHeight);
            this.runDefaults(process, callback);
        });
    }
    runWithOutCrop(callback) {
        this.runDefaults(gm(this.options.original), callback);
    }
    runDefaults(process, callback) {
        process = this.runResize(process);
        this.runWrite(process, (err) => {
            if (err) {
                return callback(err);
            }
            process = gm(this.options.target);
            this.runOptionals(process);
            if (!this.optionalsUsed) {
                return callback(null);
            }
            this.runWrite(process, callback);
        });
    }
    runResize(process) {
        return process.resize('' + this.width, '' + this.height);
    }
    runOptionals(process) {
        let rgbColor;
        if (!sb_util_ts_1.stringIsEmpty(this.options.fillColor)) {
            rgbColor = hex2rgb(this.options.fillColor);
            if (!sb_util_ts_1.arrayIsEmpty(rgbColor) && rgbColor.length === 3) {
                process = process.options({ imageMagick: true })
                    .fill(this.options.fillColor)
                    .colorize(100);
                this.optionalsUsed = true;
            }
        }
        if (!sb_util_ts_1.stringIsEmpty(this.options.colorize)) {
            rgbColor = hex2rgb(this.options.colorize);
            if (!sb_util_ts_1.arrayIsEmpty(rgbColor) && rgbColor.length === 3) {
                process = process.options({ imageMagick: true })
                    .colorize(rgbColor[0], rgbColor[1], rgbColor[2]);
                this.optionalsUsed = true;
            }
        }
        return process;
    }
    runWrite(process, callback) {
        process.write(this.options.target, function (err) {
            if (err) {
                return callback(err.message);
            }
            callback(null);
        });
    }
}
//# sourceMappingURL=generator.js.map