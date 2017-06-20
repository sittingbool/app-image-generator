//----------------------------------------------------------------------------------------------------------
import {Configuration, IGeneratorRule, IImageFileConfig} from "./configuration";
import {arrayIsEmpty, stringIsEmpty} from "sb-util-ts";
import {BaseController} from "./base-controller";
import * as path from "path";
import * as fs from "fs";
import * as gm from "gm";
import * as mkdirp from "mkdirp";
import * as _ from "lodash";
import * as hex2rgb from "hex-rgb";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export interface IGeneratorRunOptions
//----------------------------------------------------------------------------------------------------------
{
    config: Configuration;
    target?: string;
    rule: string;
}


//----------------------------------------------------------------------------------------------------------
export interface IImageProcessOptions
//----------------------------------------------------------------------------------------------------------
{
    original: string;
    target: string;
    size: string;
    noCrop?: boolean;
    createContentsJson?: boolean; // determines if a contents.json for Apple should be created
    colorize?: string; // calculated color shift
    fillColor?: string; // color to be filled on any pixel that is not transparent
}



//----------------------------------------------------------------------------------------------------------
export class Generator extends BaseController
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    configuration: Configuration;
    rules: IGeneratorRule[];
    target: string;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor( options: IGeneratorRunOptions)
    //------------------------------------------------------------------------------------------------------
    {
        super();

        this.setupWithOptions(options);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * setup method to be called to set options for this generator instance
     * @param options
     * @return {undefined}
     */
    protected setupWithOptions( options: IGeneratorRunOptions)
    //------------------------------------------------------------------------------------------------------
    {
        let rootPath;

        if ( stringIsEmpty(options.rule) ) {
            return this.setError('No configuration rule set, can not continue');
        }

        this.configuration = options.config;

        if ( options.rule.toLowerCase() === 'all' ) {

            this.rules = this.configuration.configForAllRules();

        } else if ( /^([\w])\w+(:\*)/.test(options.rule) ) { // generic rule

            this.rules = this.configuration.configForGenericRules(options.rule);
        } else {

            this.rules = [this.configuration.configForRule(options.rule)];
        }

        this.rules = this.rules.filter( item => {
            return this.ruleIsValid(item);
        });

        if ( this.rules.length < 1 ) {
            return this.setError(
                'No valid rule found for ' + options.rule + ', please check configuration');
        }

        rootPath = this.configuration.getGeneratorConfig().rootPath;

        if ( ! stringIsEmpty( rootPath ) ) {
            if ( ! rootPath.startsWith('/') ) {
                rootPath = path.join(process.cwd(), rootPath);
            }
        } else {
            rootPath = process.cwd();
        }

        if ( ! stringIsEmpty(options.target) ) {
            this.target = options.target;
            if( ! this.target.startsWith('/') ) {
                this.target = path.join(rootPath, this.target);
            }
        } else {
            this.target = rootPath;
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * Checks if a given rule object is valid
     * @param rule - the IGeneratorRule object
     * @return {boolean} - true if is valid
     */
    private ruleIsValid(rule: IGeneratorRule): boolean
    //------------------------------------------------------------------------------------------------------
    {
        return ( rule && typeof rule === 'object' &&
        (
            !stringIsEmpty(<string>rule.sourceFile) ||
            ( Array.isArray(rule.sourceFiles) && rule.sourceFiles.length )
        ) &&
        Array.isArray(rule.images) && rule.images.length > 0 && this.ruleImagesAreValid(rule.images) );
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * Checks if an image or array of images in a given rule object is valid
     * @param image - the ImageFileConfig object or array
     * @return {boolean} - true if is valid
     */
    private ruleImagesAreValid(image: IImageFileConfig | IImageFileConfig[] ): boolean
    //------------------------------------------------------------------------------------------------------
    {
        let i, current;
        if ( Array.isArray(image) ) {
            for ( i = 0; i < image.length; i++ ) {
                current = image[i];
                if ( !this.ruleImagesAreValid(current) ) {
                    return false;
                }
            }
            return true;
        }
        return ( image && typeof image === 'object' && !stringIsEmpty(image.targetPath) &&
            !stringIsEmpty(image.size) &&
            // size has right format e.g. 220x440
            /^([0-9])+x([0-9])+$/.test(image.size) &&
            !stringIsEmpty(image.fileName) );
    }


    //------------------------------------------------------------------------------------------------------
    /***
     * generates images by the set of given rules
     * @param callback - ({string}) null if everything went fine, string with an error if error occurred
     */
    generate(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let rule: IGeneratorRule;

        if ( this.rules.length < 1 ) {
            return callback(null);
        }

        rule = this.rules.shift();

        this.generateImagesFromRule(rule, err => {
            if ( err ) {
                return callback(err);
            }
            this.generate(callback);
        });
    }


    //------------------------------------------------------------------------------------------------------
    /***
     * generates images by one distinctive given rule
     * @param rule - the rule to be processed
     * @param callback - ({string}) null if everything went fine, string with an error if error occurred
     */
    generateImagesFromRule(rule: IGeneratorRule, callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let image: IImageFileConfig, process: ImageProcess, original, target, fileName;

        if ( rule.images.length < 1 ) {
            return callback(null);
        }

        if ( rule.sourceFiles && Array.isArray(rule.sourceFiles) && rule.sourceFiles.length > 0 ) {
            return this.generateImagesFromRuleWithManySources(rule, callback);
        }

        image = rule.images.shift();

        original = path.join(this.configuration.directory, rule.sourceFile);

        fileName = image.fileName;

        if ( image.replaceInTargetName  && typeof image.replaceInTargetName === 'object' ) {
            Object.keys(image.replaceInTargetName).forEach(search => {
                let val = image.replaceInTargetName[search];
                if ( typeof val === 'string' ) {
                    fileName = fileName.replace(search, val);
                }
            });
        }

        target = path.join(this.target, image.targetPath, fileName);

        if ( !stringIsEmpty(rule._targetVar) ) {
            target = target.replace('{source}', rule._targetVar);
        }

        this.generateImageWithOptions({
            original: original,
            target: target,
            size: image.size,
            noCrop: image.noCrop,
            fillColor: image.fillColor,
            colorize: image.colorize
        }, rule, callback);
    }



    //------------------------------------------------------------------------------------------------------
    // can be overridden e.g. for test or subclass purposes which use a different class as ImageProcess
    /**
     * generate a single image by options that have been processed before
     * @param options - IImageProcessOptions to generate the image
     * @param rule - IGeneratorRule currently used
     * @param callback - callback for finalizing
     */
    protected generateImageWithOptions(options: IImageProcessOptions, rule: IGeneratorRule,
                                       callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let process = new ImageProcess(options);

        process.run(err => {
            if ( err ) {
                return callback(err);
            }
            this.generateImagesFromRule(rule, callback);
        });
    }


    //------------------------------------------------------------------------------------------------------
    /***
     * generates images for each source file of one distinctive given rule
     * @param rule - the rule to be processed
     * @param callback - ({string}) null if everything went fine, string with an error if error occurred
     */
    generateImagesFromRuleWithManySources(rule: IGeneratorRule, callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let sources = rule.sourceFiles, current, runner, images = rule.images;

        rule.sourceFiles = null; // prevent cutting out in single source generation

        runner = () => {

            let fileName;

            if ( sources.length < 1 ) {
                return callback(null);
            }

            current = sources.shift();

            rule.sourceFile = current;

            fileName = path.basename(current);

            fileName = fileName.replace(path.extname(current), '');

            rule._targetVar = fileName;

            rule.images = _.clone(images); // because made empty before

            this.generateImagesFromRule(rule, (err) => {
                if ( err ) {
                    return callback(err);
                }

                runner();
            });
        };

        runner();
    }
}



//----------------------------------------------------------------------------------------------------------
class ImageProcess
//----------------------------------------------------------------------------------------------------------
{
    options: IImageProcessOptions = null;
    width: number;
    height: number;
    optionalsUsed: boolean = false;


    //------------------------------------------------------------------------------------------------------
    constructor( options: IImageProcessOptions )
    //------------------------------------------------------------------------------------------------------
    {
        let sizing: string[];

        sizing = options.size.split('x');

        this.options = _.clone(options); // clone for stability reasons

        this.width = parseInt(sizing[0]);
        this.height = parseInt(sizing[1]);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * public run method to start the process
     * @param callback - default callback
     */
    run(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let dir;

        if ( ! fs.existsSync(this.options.original) ) {
            return callback('No such file: ' + this.options.original);
        }

        if ( ! fs.lstatSync(this.options.original).isFile() ) {
            return callback('Is not a file: ' + this.options.original);
        }

        dir = path.dirname(this.options.target);

        mkdirp(dir, (err) => {

            if ( err ) {
                return callback(err.message);
            }

            if ( fs.existsSync(this.options.target) ) {
                fs.unlinkSync(this.options.target);
            }

            if ( this.options.noCrop ) {
                return this.runWithOutCrop(callback);
            }

            this.runWithCrop(callback);
        });
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * crop, run optional alterations and resize
     * @param callback - default callback
     */
    protected runWithCrop(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let relativeWidth, relativeHeight, process;

        console.log('Processing: ' + this.options.original + ' -> ' + this.options.target);

        gm(this.options.original)
            .size((err, size) => {
                if (err) {
                    return callback(err.message);
                }

                if ( size.width < this.width ) { // shrink target frame to fit width of original
                    relativeWidth = size.width;
                    relativeHeight = (size.width / this.width ) * this.height;

                    if ( relativeHeight > size.height ) { // shrink target frame to fit height of original too
                        relativeWidth = ( size.height / relativeHeight ) * relativeWidth; // fit height in the same relation
                        relativeHeight = size.height;
                    }
                } else if ( size.height < this.height ) { // shrink target frame to fit width of original
                    relativeHeight = size.height;
                    relativeWidth = (size.height / this.height ) * this.width;

                    if ( relativeWidth > size.width ) { // shrink target frame to fit height of original too
                        relativeHeight = ( size.width / relativeWidth ) * relativeHeight; // fit width in the same relation
                        relativeWidth = size.width;
                    }
                } else if ( size.width / this.width > size.height / this.height ) {
                    // the wanted with is bigger in relation to the original than the wanted height to the original height ->
                    // height is used to set relation

                    relativeHeight = size.height;
                    relativeWidth = (this.width / this.height) * relativeHeight;
                } else {
                    // the wanted with is bigger/same in relation to the original than the wanted height to the original height ->
                    // width is used to set relation
                    relativeWidth = size.width;
                    relativeHeight = ( this.height / this.width ) * relativeWidth;
                }

                if ( relativeWidth > size.width || relativeHeight > size.height ) {
                    return callback('Relative sizes miscalculation');
                }

                process = gm(this.options.original)
                    .gravity('Center')
                    .crop(''+relativeWidth, ''+relativeHeight);


                this.runDefaults(process, callback);
            });
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * run without crop. only run optional alterations, resize
     * @param callback
     */
    protected runWithOutCrop(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        this.runDefaults(gm(this.options.original), callback);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * run default processes (resize, optional alterations)
     * @param process - gm process that was defined before
     * @param callback - default callback
     */
    protected runDefaults(process: any, callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        process = this.runResize(process);

        this.runWrite( process, (err) => {
            if ( err ) {
                return callback(err);
            }

            process = gm(this.options.target);

            this.runOptionals(process);

            if ( !this.optionalsUsed ) {
                return callback(null);
            }

            this.runWrite( process, callback);
        });
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * adds resize setting to gm process
     * @param process - gm process that was defined before
     * @return {any} - altered gm process
     */
    protected runResize(process: any): any
    //------------------------------------------------------------------------------------------------------
    {
        return process.resize(''+this.width, ''+this.height);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * adds optional settings to gm process
     * @param process - gm process that was defined before
     * @return {any} - altered gm process
     */
    protected runOptionals(process: any): any
    //------------------------------------------------------------------------------------------------------
    {
        let rgbColor: number[];

        // IMPORTANT: set this.optionalsUsed = true if done something here

        if ( !stringIsEmpty(this.options.fillColor) ) {
            rgbColor = hex2rgb(this.options.fillColor);
            if ( !arrayIsEmpty(rgbColor) && rgbColor.length === 3 ) {
                process = process.options({imageMagick: true})
                    .fill(this.options.fillColor)
                    .colorize(100);
                this.optionalsUsed = true;
            }
        }

        if ( !stringIsEmpty(this.options.colorize) ) {
            rgbColor = hex2rgb(this.options.colorize);
            if ( !arrayIsEmpty(rgbColor) && rgbColor.length === 3 ) {
                process = process.options({imageMagick: true})
                    .colorize(rgbColor[0], rgbColor[1], rgbColor[2]);
                this.optionalsUsed = true;
            }
        }

        return process;
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * executes write to file
     * @param process - gm process that was defined before and should be executed
     * @param callback - default callback
     */
    protected runWrite(process: any, callback: (err: string) => void): any
    //------------------------------------------------------------------------------------------------------
    {
        process.write( this.options.target, function (err) {
            if ( err ) {
                return callback(err.message);
            }
            callback(null);
        });
    }
}

