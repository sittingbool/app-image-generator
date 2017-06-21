"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sb_util_ts_1 = require("sb-util-ts");
const path = require("path");
const fs = require("fs");
const gm = require("gm");
const mkdirp = require("mkdirp");
const _ = require("lodash");
const hex2rgb = require("hex-rgb");
class ImageProcess {
    constructor(options, contentsJsonUpdater) {
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
                .crop(relativeWidth, relativeHeight);
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
            if (this.options.compose && typeof this.options.compose === 'object') {
                return this.runCompose(process, callback);
            }
            this.runWrite(process, callback);
        });
    }
    runCompose(process, callback) {
        this.runWrite(process, err => {
            if (err) {
                callback(err);
            }
            process = gm(this.options.target);
            process = this.compose(process, this.options.compose);
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
        if (this.options.compose && typeof this.options.compose === 'object') {
            this.optionalsUsed = true;
        }
        return process;
    }
    compose(process, options) {
        let geometry = "", composePath;
        let directionForValue = (value) => {
            if (value >= 0) {
                return '+';
            }
            return '-';
        };
        composePath = path.join(path.dirname(this.options.original), options.composeImage);
        if (!fs.existsSync(composePath)) {
            console.log("Cannot find path " + composePath +
                " to compose with " + this.options.original + ", so skipping it.");
            return process;
        }
        if (!sb_util_ts_1.stringIsEmpty(options.size)) {
            geometry += options.size;
        }
        if (typeof options.offsetX === 'number') {
            geometry += directionForValue(options.offsetX) + options.offsetX;
        }
        if (typeof options.offsetY === 'number') {
            geometry += directionForValue(options.offsetY) + options.offsetY;
        }
        process = process.composite(composePath);
        if (!sb_util_ts_1.stringIsEmpty(geometry)) {
            process = process.geometry(geometry);
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
exports.ImageProcess = ImageProcess;
//# sourceMappingURL=image-processor.js.map