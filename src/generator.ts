//----------------------------------------------------------------------------------------------------------
import {Configuration, IGeneratorRule, IImageFileConfig} from "./configuration";
import {IImageProcessOptions, ImageProcess} from "./image-processor";
import {ContentsFileUpdater} from "./contents-json-updater";
import {stringIsEmpty} from "sb-util-ts";
import {BaseController} from "./base-controller";
import * as path from "path";
import * as _ from "lodash";
import {Validator} from "./validator";
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

    contentFileUpdater?: ContentsFileUpdater;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor( options: IGeneratorRunOptions)
    //------------------------------------------------------------------------------------------------------
    {
        super();

        this.contentFileUpdater = new ContentsFileUpdater();

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
            return Validator.ruleIsValid(item);
        });

        if ( this.rules.length < 1 ) {
            return this.setError(
                'Invalid rule found for ' + options.rule + ', please check configuration');
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
        let image: IImageFileConfig, original, target;

        if ( rule.images.length < 1 ) {
            return callback(null);
        }

        if ( rule.sourceFiles && Array.isArray(rule.sourceFiles) && rule.sourceFiles.length > 0 ) {
            return this.generateImagesFromRuleWithManySources(rule, callback);
        }

        image = rule.images.shift();

        original = path.join(this.configuration.directory, rule.sourceFile);

        target = path.join(this.target, image.targetPath, image.fileName);

        if ( !stringIsEmpty(rule._targetVar) ) {
            target = target.replace('{source}', rule._targetVar);
        }

        target = this.applyReplacementsInTargetName(target, image.replaceInTargetName);

        this.generateImageWithOptions({
            original: original,
            target: target,
            size: image.size,
            noCrop: image.noCrop,
            fillColor: image.fillColor,
            colorize: image.colorize,
            compose: image.compose
        }, rule, callback);
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * replaces an object of key value pairs into the target path name where the key is the current
     * and the value is the new substring
     * @param targetName - the string that the replacement should be done in
     * @param replacements - the key - value - paring for the parts to replace
     * @return {string} - the resulting string
     */
    protected applyReplacementsInTargetName(targetName:string,
                                            replacements?: {[key: string]: string}): string
    //------------------------------------------------------------------------------------------------------
    {
        if ( replacements  && typeof replacements === 'object' ) {
            Object.keys(replacements).forEach(search => {
                let val = replacements[search];
                if ( typeof val === 'string' ) {
                    targetName = targetName.replace(search, val);
                }
            });
        }

        return targetName;
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

        rule.sourceFiles = null; // prevent opting out in single source generation

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