import { IGeneratorRule, IImageFileConfig } from "./configuration";
export declare class Validator {
    static ruleIsValid(rule: IGeneratorRule): boolean;
    static ruleImagesAreValid(image: IImageFileConfig | IImageFileConfig[]): boolean;
}
