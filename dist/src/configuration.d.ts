import { BaseController } from "./base-controller";
export interface IImageFileConfig {
    fileName: string;
    targetPath: string;
    size: string;
}
export interface IGeneratorConfig {
    rootPath?: string;
    createContentsJson?: boolean;
}
export interface IGeneratorRule {
    name?: string;
    sourceFile: string;
    images: IImageFileConfig[];
}
export declare class GeneratorRule implements IGeneratorRule {
    name?: string;
    sourceFile: string;
    images: IImageFileConfig[];
    static withConfig(config: IGeneratorRule): GeneratorRule;
}
export declare class Configuration extends BaseController {
    configPath: string;
    error: string;
    private config;
    constructor(directory: string, fileName: string);
    setupPath(directory: string, fileName: string): void;
    loadConfig(): void;
    configForRule(rule: string): IGeneratorRule;
    getGeneratorConfig(): IGeneratorConfig;
}
