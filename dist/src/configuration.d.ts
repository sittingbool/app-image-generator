import { BaseController } from "./base-controller";
export declare type TComposeLevel = 'top' | 'below';
export interface IComposeOptions {
    composeImage: string;
    topOrBelow: TComposeLevel;
    size?: string;
    offsetX?: number;
    offsetY?: number;
}
export declare type TDeviceIdiom = 'iphone' | 'ipad' | 'universal';
export declare type TiOSImageScale = '1x' | '2x' | '3x';
export interface IContentsJSONConfig {
    idiom: TDeviceIdiom;
    scale: TiOSImageScale;
}
export interface IImageFileConfig {
    fileName: string;
    targetPath: string;
    size: string;
    noCrop?: boolean;
    createContentsJson?: IContentsJSONConfig;
    colorize?: string;
    fillColor?: string;
    compose?: IComposeOptions;
    replaceInTargetName?: {
        [key: string]: string;
    };
}
export interface IGeneratorConfig {
    rootPath?: string;
    createContentsJson?: IContentsJSONConfig;
}
export interface IGeneratorRule {
    name?: string;
    sourceFile?: string;
    sourceFiles?: string[];
    images: IImageFileConfig[];
    createContentsJson?: IContentsJSONConfig;
    _targetVar?: string;
}
export declare class GeneratorRule implements IGeneratorRule {
    name?: string;
    sourceFile: string;
    images: IImageFileConfig[];
    static withConfig(config: IGeneratorRule): GeneratorRule;
}
export declare class Configuration extends BaseController {
    configPath: string;
    directory: string;
    error: string;
    private config;
    constructor(directory: string, fileName: string);
    setupPath(directory: string, fileName: string): void;
    loadConfig(): void;
    configForRule(rule: string): IGeneratorRule;
    configForGenericRules(ruleBeginning: string): IGeneratorRule[];
    configForAllRules(): IGeneratorRule[];
    getGeneratorConfig(): IGeneratorConfig;
}
