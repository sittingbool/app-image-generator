//----------------------------------------------------------------------------------------------------------
import * as fs from 'fs';
import * as path from 'path';
import {stringIsEmpty} from "sb-util-ts";
import {BaseController} from "./base-controller";
//----------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------
export interface IImageFileConfig
//------------------------------------------------------------------------------------------------------
{
    fileName: string;
    targetPath: string;
    size: string;
    noCrop?: boolean; // prevents image from being cropped
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
export class Configuration extends BaseController
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    configPath: string = null;
    directory: string;
    error: string = null;

    private config: IConfigStructure;
    //------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------
    constructor( directory: string, fileName: string)
    //------------------------------------------------------------------------------------------------------
    {
        super();

        this.setupPath(directory, fileName);

        this.loadConfig()
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

        this.directory = directory; // for later access by generator

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
    configForGenericRules(ruleBeginning: string): IGeneratorRule[]
    //------------------------------------------------------------------------------------------------------
    {
        let rules = [], keys: string[];

        if ( stringIsEmpty(ruleBeginning) || this.error || !this.config.rules ||
            typeof this.config.rules !== 'object' )
        {
            return rules;
        }

        if ( ruleBeginning.endsWith('*') ) {
            ruleBeginning = ruleBeginning.substring(0, ruleBeginning.length-1).trim();

            if ( stringIsEmpty(ruleBeginning) )
            {
                return rules;
            }
        }

        keys = Object.keys(this.config.rules).filter( item => {
            return item.startsWith(ruleBeginning);
        });

        keys.forEach(item => {
            rules.push(this.config.rules[item]);
        });

        return rules;
    }


    //------------------------------------------------------------------------------------------------------
    configForAllRules(): IGeneratorRule[]
    //------------------------------------------------------------------------------------------------------
    {
        let rules = [];

        if ( this.error || !this.config.rules || typeof this.config.rules !== 'object' )
        {
            return rules;
        }

        Object.keys(this.config.rules).forEach(key => {
            rules.push(this.config.rules[key]);
        });

        return rules;
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