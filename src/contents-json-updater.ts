//----------------------------------------------------------------------------------------------------------
import {IContentsJSONConfig} from "./configuration";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";
import {stringIsEmpty} from "sb-util-ts";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export interface IContentsFileImageDefinition
//----------------------------------------------------------------------------------------------------------
{
    idiom: string;
    filename: string;
    scale: string;
}



//----------------------------------------------------------------------------------------------------------
export class ContentsFileUpdater
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    protected directories: string[] = []; // directories to be updated
    protected fileConfigs: {[fPath: string] : IContentsJSONConfig } = {};
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor()
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * adds a directory to the list of directories that should be processed, checks if already known
     * @param path - the absolute path to the directory
     * @param alreadyCheckedExistence - for performance reasons set to true if the existence of
     * this dir was checked before, will be checked here
     */
    addDirectory(path: string, alreadyCheckedExistence: boolean = false)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !alreadyCheckedExistence && !fs.existsSync(path) ) {
            return;
        }

        if ( this.directories.indexOf(path) >= 0 ) {
            return;
        }

        this.directories.push(path);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * add a config for the file that define idiom, scale
     * @param filePath - absolute path of the file
     * @param config - IContentsJSONConfig definition
     */
    addConfigForFile(filePath: string, config: IContentsJSONConfig)
    //------------------------------------------------------------------------------------------------------
    {
        if ( stringIsEmpty(filePath) || !filePath.startsWith('/') ) {
            return console.log( 'Tried to add an invalid file definition to create Contents.json for file '
                + filePath);
        }

        this.fileConfigs[filePath] = config;
    }


    //------------------------------------------------------------------------------------------------------
    run()
    //------------------------------------------------------------------------------------------------------
    {
        if ( this.directories.length < 1 ) {
            return;
        }
        this.directories.forEach( dir => {
            this.runForDirectory(dir);
        });
    }


    //------------------------------------------------------------------------------------------------------
    protected runForDirectory(directory: string)
    //------------------------------------------------------------------------------------------------------
    {
        let data, fileData: string, filePath = path.join(directory, 'Contents.json'),
            content: string[], currentImages = [];

        if ( fs.existsSync(filePath) ) {
            fileData = fs.readFileSync(filePath, 'utf8');

            try {
                data = JSON.parse(fileData);
            } catch ( err ) {
                console.log(err);
                return;
            }
        } else {
            data = {
                images : [],
                info : {
                    version : 1,
                    author : "xcode"
                }
            }
        }

        content = fs.readdirSync(directory);

        content = content.filter(item => {
            let extension = path.extname(item).substring(1);
            return ( ! item.startsWith('.') &&
            ['jpeg', 'jpg', 'pdf', 'png', 'tiff'].indexOf(extension) >= 0 );
        });

        content.forEach(file => {
            let existing: IContentsFileImageDefinition =
                <IContentsFileImageDefinition>_.find(data.images, { filename: file });

            let fileConfig:IContentsJSONConfig =
                this.fileConfigs[path.join(directory, file)] || { idiom: 'universal' , scale: '2x'};

            if ( ! existing ) {
                existing = { idiom: fileConfig.idiom , scale: fileConfig.scale, filename: file };
            } else { // update settings
                existing.idiom = fileConfig.idiom;
                existing.scale = fileConfig.scale;
            }

            currentImages.push(existing);
        });

        data.images = currentImages;

        try {
            fileData = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, fileData, { encoding: 'utf8', flag : 'w' });
            console.log('Updated Contents.json in ' + path.dirname(filePath) );
        } catch(err) {
            console.error('Could not create Contents.json in ' + directory + ' because: ' + err.message);
        }
    }
}