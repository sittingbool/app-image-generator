export interface IContentsFileImageDefinition {
    idiom: string;
    filename: string;
    scale: string;
}
export declare class ContentsFileUpdater {
    protected directories: string[];
    constructor();
    addDirectory(path: string, alreadyCheckedExistence?: boolean): void;
    run(): void;
    protected runForDirectory(directory: string): void;
}
