"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sb_util_ts_1 = require("sb-util-ts");
const base_controller_1 = require("./base-controller");
const path = require("path");
const fs = require("fs");
const gm = require("gm");
const mkdirp = require("mkdirp");
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
        return (rule && typeof rule === 'object' && !sb_util_ts_1.stringIsEmpty(rule.sourceFile) &&
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
        let image, process, original, target;
        if (rule.images.length < 1) {
            return callback(null);
        }
        image = rule.images.shift();
        original = path.join(this.configuration.directory, rule.sourceFile);
        target = path.join(this.target, image.targetPath, image.fileName);
        process = new ImageProcess(original, target, image.size, image.noCrop);
        process.run(err => {
            if (err) {
                return callback(err);
            }
            this.generateImagesFromRule(rule, callback);
        });
    }
}
exports.Generator = Generator;
class ImageProcess {
    constructor(original, target, size, noCrop = false) {
        let sizing;
        this.original = original;
        this.target = target;
        this.noCrop = noCrop;
        sizing = size.split('x');
        this.width = parseInt(sizing[0]);
        this.height = parseInt(sizing[1]);
    }
    run(callback) {
        let dir;
        if (!fs.existsSync(this.original)) {
            return callback('No such file: ' + this.original);
        }
        if (!fs.lstatSync(this.original).isFile()) {
            return callback('Is not a file: ' + this.original);
        }
        dir = path.dirname(this.target);
        mkdirp(dir, (err) => {
            if (err) {
                return callback(err.message);
            }
            if (fs.existsSync(this.target)) {
                fs.unlinkSync(this.target);
            }
            if (this.noCrop) {
                return this.runWithOutCrop(callback);
            }
            this.runWithCrop(callback);
        });
    }
    runWithCrop(callback) {
        let relativeWidth, relativeHeight;
        console.log('Processing: ' + this.original + ' -> ' + this.target);
        gm(this.original)
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
            gm(this.original)
                .gravity('Center')
                .crop('' + relativeWidth, '' + relativeHeight)
                .resize('' + this.width, '' + this.height)
                .write(this.target, function (err) {
                if (err) {
                    return callback(err.message);
                }
                callback(null);
            });
        });
    }
    runWithOutCrop(callback) {
        gm(this.original)
            .resize('' + this.width, '' + this.height)
            .write(this.target, function (err) {
            if (err) {
                return callback(err.message);
            }
            callback(null);
        });
    }
}
//# sourceMappingURL=generator.js.map