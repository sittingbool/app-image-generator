//----------------------------------------------------------------------------------------------------------
import * as fs from 'fs';
import * as path from 'path';
import {stringIsEmpty} from "sb-util-ts";
//----------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------
export interface IImageFileConfig
//------------------------------------------------------------------------------------------------------
{
    fileName: string;
    targetPath: string;
    size: string;
}


//------------------------------------------------------------------------------------------------------
export interface IGeneratorConfig
//------------------------------------------------------------------------------------------------------
{
    rootPath?: string;
    createContentsJson?: boolean; // if set to yes a contents.json like needed in ios will be created
}


//------------------------------------------------------------------------------------------------------
export interface IGeneratorRule
//------------------------------------------------------------------------------------------------------
{
    name?: string;
    sourceFile: string; // absolute or relative path
    images: IImageFileConfig[]
}


//------------------------------------------------------------------------------------------------------
export class GeneratorRule implements IGeneratorRule
//------------------------------------------------------------------------------------------------------
{
    name?: string = "";
    sourceFile: string = null; // absolute or relative path
    images: IImageFileConfig[] = [];

    static withConfig(config: IGeneratorRule): GeneratorRule {
        let instance = new this();

        Object.keys(config).forEach( key => {
            instance[key] = config[key];
        });

        if ( ! instance.images || !Array.isArray(instance.images) ) {
            instance.images = [];
        }

        return instance;
    }
}


//----------------------------------------------------------------------------------------------------------
interface IConfigStructure
//----------------------------------------------------------------------------------------------------------
{
    options: IGeneratorConfig;
    rules: { [key: string]: IGeneratorRule };
}


//----------------------------------------------------------------------------------------------------------
export class Configuration
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    configPath: string = null;
    error: string = null;

    private config: IConfigStructure;
    //------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------
    constructor( directory: string, fileName: string)
    //------------------------------------------------------------------------------------------------------
    {
        this.setupPath(directory, fileName);

        this.loadConfig()
    }


    //------------------------------------------------------------------------------------------------------
    private setError(error: string)
    //------------------------------------------------------------------------------------------------------
    {
        this.error = error;
    }


    //------------------------------------------------------------------------------------------------------
    setupPath(directory: string, fileName: string)
    //------------------------------------------------------------------------------------------------------
    {
        let stat;

        if ( !directory ) {
            return this.setError('No directory given');
        }

        if ( ! directory.startsWith('/') ) {
            directory = path.join(process.cwd(), directory);
        }

        if ( !fs.existsSync(directory) ) {
            return this.setError('No such directory: '+directory);
        }

        try {
            stat = fs.lstatSync(directory);
        } catch (err) {
            return this.setError(err.message);
        }

        if ( !stat.isDirectory() ) {
            return this.setError('The path: '+directory + ' is not a directory');
        }

        if ( !fileName || stringIsEmpty(fileName) ) {
            fileName = 'appig.json'
        }

        this.configPath = path.join(directory, fileName);

        if ( !this.configPath.endsWith('.json') ) {
            if ( !fs.existsSync(this.configPath) ) {
                if ( fs.existsSync(this.configPath + '.json') ) {
                    this.configPath += '.json';
                }
            }
        }

        try {
            stat = fs.lstatSync(this.configPath);
        } catch (err) {
            return this.setError(err.message);
        }

        if ( !stat.isFile() ) {
            return this.setError('The path: ' + this.configPath + ' is not a file');
        }
    }


    //------------------------------------------------------------------------------------------------------
    loadConfig()
    //------------------------------------------------------------------------------------------------------
    {
        if ( this.error ) {
            console.error(this.error);
            return;
        }

        let fileData = fs.readFileSync(this.configPath, 'utf8');

        try {
            this.config = JSON.parse(fileData);
        } catch (err) {
            return this.setError(err.message)
        }
    }


    //------------------------------------------------------------------------------------------------------
    configForRule(rule: string): IGeneratorRule
    //------------------------------------------------------------------------------------------------------
    {
        let defaultRule: GeneratorRule = new GeneratorRule();

        if ( stringIsEmpty(rule) || this.error || !this.config.rules ||
            typeof this.config.rules !== 'object' || typeof this.config.rules[rule] !== 'object' )
        {
            return defaultRule;
        }

        return GeneratorRule.withConfig(this.config.rules[rule]) || defaultRule;
    }


    //------------------------------------------------------------------------------------------------------
    getGeneratorConfig(): IGeneratorConfig
    //------------------------------------------------------------------------------------------------------
    {
        if ( this.error || !this.config.options || typeof this.config.options !== 'object' ) {
            return {};
        }

        return this.config.options;
    }

}