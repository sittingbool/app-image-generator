import { IContentsJSONConfig, IGeneratorRule, IImageFileConfig } from "./configuration";
export declare class Validator {
    static ruleIsValid(rule: IGeneratorRule): boolean;
    static ruleImagesAreValid(image: IImageFileConfig | IImageFileConfig[]): boolean;
    static contentsJsonConfigIsValid(config: IContentsJSONConfig): boolean;
}
