import { Configuration, IGeneratorRule } from "./configuration";
import { IImageProcessOptions } from "./image-processor";
import { ContentsFileUpdater } from "./contents-json-updater";
import { BaseController } from "./base-controller";
export interface IGeneratorRunOptions {
    config: Configuration;
    target?: string;
    rule: string;
}
export declare class Generator extends BaseController {
    configuration: Configuration;
    rules: IGeneratorRule[];
    target: string;
    contentFileUpdater?: ContentsFileUpdater;
    constructor(options: IGeneratorRunOptions);
    protected setupWithOptions(options: IGeneratorRunOptions): void;
    generate(callback: (err: string) => void): void;
    generateImagesFromRule(rule: IGeneratorRule, callback: (err: string) => void): void;
    protected applyReplacementsInTargetName(targetName: string, replacements?: {
        [key: string]: string;
    }): string;
    protected generateImageWithOptions(options: IImageProcessOptions, rule: IGeneratorRule, callback: (err: string) => void): void;
    generateImagesFromRuleWithManySources(rule: IGeneratorRule, callback: (err: string) => void): void;
}
