import { Configuration, IGeneratorRule } from "./configuration";
import { BaseController } from "./base-controller";
export interface IGeneratorRunOptions {
    config: Configuration;
    target?: string;
    rule: string;
}
export declare class Generator extends BaseController {
    configuration: Configuration;
    rule: IGeneratorRule;
    target: string;
    constructor(options: IGeneratorRunOptions);
    setupWithOptions(options: IGeneratorRunOptions): void;
}
export declare class ImageProcess {
    constructor(original: string, target: string, size: string);
}
