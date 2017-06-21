"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sb_util_ts_1 = require("sb-util-ts");
const sizeRegex = /^([0-9])+x([0-9])+$/;
class Validator {
    static ruleIsValid(rule) {
        let valid = (rule && typeof rule === 'object' &&
            (!sb_util_ts_1.stringIsEmpty(rule.sourceFile) ||
                (Array.isArray(rule.sourceFiles) && rule.sourceFiles.length)) &&
            Array.isArray(rule.images) && rule.images.length > 0 && this.ruleImagesAreValid(rule.images));
        if (valid && rule.createContentsJson && typeof rule.createContentsJson === 'object') {
            valid = this.contentsJsonConfigIsValid(rule.createContentsJson);
            if (!valid) {
                console.log('The definition of createContentsJson on your rule regarding ' +
                    (rule.sourceFile || rule.sourceFiles[0] || rule.name) + ' is invalid');
            }
        }
        return valid;
    }
    static ruleImagesAreValid(image) {
        let i, current, valid, compose;
        if (Array.isArray(image)) {
            for (i = 0; i < image.length; i++) {
                current = image[i];
                if (!this.ruleImagesAreValid(current)) {
                    return false;
                }
            }
            return true;
        }
        valid = (image && typeof image === 'object' && !sb_util_ts_1.stringIsEmpty(image.targetPath) &&
            !sb_util_ts_1.stringIsEmpty(image.size) && sizeRegex.test(image.size) && !sb_util_ts_1.stringIsEmpty(image.fileName));
        if (!valid) {
            console.log('validation error in image rule for image named "' +
                (image.targetPath || 'name missing') + '"');
        }
        if (valid && image.compose && typeof image.compose === 'object') {
            compose = image.compose;
            valid = (!sb_util_ts_1.stringIsEmpty(compose.composeImage) &&
                (sb_util_ts_1.stringIsEmpty(compose.size) || sizeRegex.test(compose.size)));
        }
        if (!valid) {
            console.log('validation error in image compose rule for image named "' +
                (image.targetPath || 'name missing') + '"');
        }
        if (valid && image.createContentsJson && typeof image.createContentsJson === 'object') {
            valid = this.contentsJsonConfigIsValid(image.createContentsJson);
            if (!valid) {
                console.log('The definition of createContentsJson on your image definition targeting ' +
                    (image.targetPath || '(unknown)') + ' is invalid');
            }
        }
        return valid;
    }
    static contentsJsonConfigIsValid(config) {
        return (!sb_util_ts_1.stringIsEmpty(config.idiom) &&
            ['iphone', 'ipad', 'universal'].indexOf(config.idiom) >= 0 &&
            !sb_util_ts_1.stringIsEmpty(config.scale) &&
            ['1x', '2x', '3x'].indexOf(config.scale) >= 0);
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map