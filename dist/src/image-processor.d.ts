import { IComposeOptions, IContentsJSONConfig } from "./configuration";
import { ContentsFileUpdater } from "./contents-json-updater";
export interface IImageProcessOptions {
    original: string;
    target: string;
    size: string;
    noCrop?: boolean;
    createContentsJson?: IContentsJSONConfig;
    colorize?: string;
    fillColor?: string;
    compose?: IComposeOptions;
}
export declare class ImageProcess {
    options: IImageProcessOptions;
    width: number;
    height: number;
    optionalsUsed: boolean;
    constructor(options: IImageProcessOptions, contentsJsonUpdater?: ContentsFileUpdater);
    run(callback: (err: string) => void): void;
    protected runWithCrop(callback: (err: string) => void): void;
    protected runWithOutCrop(callback: (err: string) => void): void;
    protected runDefaults(process: any, callback: (err: string) => void): void;
    protected runCompose(process: any, callback: (err: string) => void): any;
    protected runResize(process: any): any;
    protected runOptionals(process: any): any;
    protected compose(process: any, options: IComposeOptions): any;
    protected runWrite(process: any, callback: (err: string) => void): any;
}
