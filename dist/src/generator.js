"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sb_util_ts_1 = require("sb-util-ts");
const base_controller_1 = require("./base-controller");
class Generator extends base_controller_1.BaseController {
    constructor(options) {
        super();
        this.setupWithOptions(options);
    }
    setupWithOptions(options) {
        if (sb_util_ts_1.stringIsEmpty(options.rule)) {
            return this.setError('No configuration rule set, can not continue');
        }
        this.configuration = options.config;
    }
}
exports.Generator = Generator;
class ImageProcess {
    constructor(original, target, size) {
    }
}
exports.ImageProcess = ImageProcess;
//# sourceMappingURL=generator.js.map