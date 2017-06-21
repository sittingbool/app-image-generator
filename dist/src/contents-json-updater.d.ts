import { IContentsJSONConfig } from "./configuration";
export interface IContentsFileImageDefinition {
    idiom: string;
    filename: string;
    scale: string;
}
export declare class ContentsFileUpdater {
    protected directories: string[];
    protected fileConfigs: {
        [fPath: string]: IContentsJSONConfig;
    };
    constructor();
    addDirectory(path: string, alreadyCheckedExistence?: boolean): void;
    addConfigForFile(filePath: string, config: IContentsJSONConfig): void;
    run(): void;
    protected runForDirectory(directory: string): void;
}
