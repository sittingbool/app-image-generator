//----------------------------------------------------------------------------------------------------------
import {Configuration, IGeneratorRule, IImageFileConfig} from "./configuration";
import {stringIsEmpty} from "sb-util-ts";
import {BaseController} from "./base-controller";
import * as path from "path";
import * as fs from "fs";
import * as gm from "gm";
import * as mkdirp from "mkdirp";
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
    setupWithOptions( options: IGeneratorRunOptions)
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
        return ( rule && typeof rule === 'object' && !stringIsEmpty(rule.sourceFile) &&
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
        let image: IImageFileConfig, process: ImageProcess, original, target;

        if ( rule.images.length < 1 ) {
            return callback(null);
        }

        image = rule.images.shift();

        original = path.join(this.configuration.directory, rule.sourceFile);

        target = path.join(this.target, image.targetPath, image.fileName);

        process = new ImageProcess(original, target, image.size, image.noCrop);

        process.run(err => {
            if ( err ) {
                return callback(err);
            }
            this.generateImagesFromRule(rule, callback);
        });
    }
}



//----------------------------------------------------------------------------------------------------------
class ImageProcess
//----------------------------------------------------------------------------------------------------------
{
    original: string;
    target: string;
    noCrop: boolean;
    width: number;
    height: number;


    //------------------------------------------------------------------------------------------------------
    constructor( original: string, target: string, size: string, noCrop = false)
    //------------------------------------------------------------------------------------------------------
    {
        let sizing: string[];
        this.original = original;
        this.target = target;
        this.noCrop = noCrop;
        sizing = size.split('x');

        this.width = parseInt(sizing[0]);
        this.height = parseInt(sizing[1]);
    }


    //------------------------------------------------------------------------------------------------------
    run(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let dir;

        if ( ! fs.existsSync(this.original) ) {
            return callback('No such file: ' + this. original);
        }

        if ( ! fs.lstatSync(this.original).isFile() ) {
            return callback('Is not a file: ' + this. original);
        }

        dir = path.dirname(this.target);

        mkdirp(dir, (err) => {

            if ( err ) {
                return callback(err.message);
            }

            if ( fs.existsSync(this.target) ) {
                fs.unlinkSync(this.target);
            }

            if ( this.noCrop ) {
                return this.runWithOutCrop(callback);
            }

            this.runWithCrop(callback);
        });
    }


    //------------------------------------------------------------------------------------------------------
    runWithCrop(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        let relativeWidth, relativeHeight;

        console.log('Processing: ' + this.original + ' -> ' + this.target);

        gm(this.original)
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

                gm(this.original)
                    .gravity('Center')
                    .crop(''+relativeWidth, ''+relativeHeight)
                    .resize(''+this.width, ''+this.height)
                    .write( this.target, function (err) {
                        if ( err ) {
                            return callback(err.message);
                        }
                        callback(null);
                    });
            });
    }


    //------------------------------------------------------------------------------------------------------
    runWithOutCrop(callback: (err: string) => void)
    //------------------------------------------------------------------------------------------------------
    {
        gm(this.original)
            .resize(''+this.width, ''+this.height)
            .write( this.target, function (err) {
                if ( err ) {
                    return callback(err.message);
                }
                callback(null);
            });
    }
}

