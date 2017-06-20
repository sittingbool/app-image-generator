import { Configuration, IComposeOptions, IGeneratorRule } from "./configuration";
import { BaseController } from "./base-controller";
export interface IGeneratorRunOptions {
    config: Configuration;
    target?: string;
    rule: string;
}
export interface IImageProcessOptions {
    original: string;
    target: string;
    size: string;
    noCrop?: boolean;
    createContentsJson?: boolean;
    colorize?: string;
    fillColor?: string;
    compose?: IComposeOptions;
}
export declare class Generator extends BaseController {
    configuration: Configuration;
    rules: IGeneratorRule[];
    target: string;
    constructor(options: IGeneratorRunOptions);
    protected setupWithOptions(options: IGeneratorRunOptions): void;
    private ruleIsValid(rule);
    private ruleImagesAreValid(image);
    generate(callback: (err: string) => void): void;
    generateImagesFromRule(rule: IGeneratorRule, callback: (err: string) => void): void;
    protected applyReplacementsInTargetName(targetName: string, replacements?: {
        [key: string]: string;
    }): string;
    protected generateImageWithOptions(options: IImageProcessOptions, rule: IGeneratorRule, callback: (err: string) => void): void;
    generateImagesFromRuleWithManySources(rule: IGeneratorRule, callback: (err: string) => void): void;
}
