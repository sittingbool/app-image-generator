//----------------------------------------------------------------------------------------------------------
import {IComposeOptions, IContentsJSONConfig, IGeneratorRule, IImageFileConfig} from "./configuration";
import {stringIsEmpty} from "sb-util-ts";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
// to test if size has right format e.g. 220x440
const sizeRegex = /^([0-9])+x([0-9])+$/;
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export class Validator
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    /**
     * Checks if a given rule object is valid
     * @param rule - the IGeneratorRule object
     * @return {boolean} - true if is valid
     */
    static ruleIsValid(rule: IGeneratorRule): boolean
    //------------------------------------------------------------------------------------------------------
    {
        let valid = ( rule && typeof rule === 'object' &&
        (
            !stringIsEmpty(<string>rule.sourceFile) ||
            ( Array.isArray(rule.sourceFiles) && rule.sourceFiles.length )
        ) &&
        Array.isArray(rule.images) && rule.images.length > 0 && this.ruleImagesAreValid(rule.images) );

        if ( valid && rule.createContentsJson && typeof rule.createContentsJson === 'object' ) {
            valid = this.contentsJsonConfigIsValid(rule.createContentsJson);

            if( !valid ) {
                console.log('The definition of createContentsJson on your rule regarding ' +
                    ( rule.sourceFile || rule.sourceFiles[0] || rule.name) + ' is invalid');
            }
        }

        return valid;
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * Checks if an image or array of images in a given rule object is valid
     * @param image - the ImageFileConfig object or array
     * @return {boolean} - true if is valid
     */
    static ruleImagesAreValid(image: IImageFileConfig | IImageFileConfig[] ): boolean
    //------------------------------------------------------------------------------------------------------
    {
        let i, current, valid, compose: IComposeOptions;

        // if array of images, test each one of them
        if ( Array.isArray(image) ) {
            for ( i = 0; i < image.length; i++ ) {
                current = image[i];
                if ( !this.ruleImagesAreValid(current) ) {
                    return false;
                }
            }
            return true;
        }

        // must have necessary properties in the right type
        valid = ( image && typeof image === 'object' && !stringIsEmpty(image.targetPath) &&
        !stringIsEmpty(image.size) && sizeRegex.test(image.size) && !stringIsEmpty(image.fileName) );

        if ( !valid ) {
            console.log('validation error in image rule for image named "' +
                (image.targetPath || 'name missing' ) + '"' );
        }

        // if has image.compose option set then it mus be valid
        if ( valid && image.compose && typeof image.compose === 'object' ) {
            compose = image.compose;

            valid = ( !stringIsEmpty(compose.composeImage) &&
            ( stringIsEmpty(compose.size) || sizeRegex.test(compose.size) ) );
        }

        if ( !valid ) {
            console.log('validation error in image compose rule for image named "' +
                (image.targetPath || 'name missing' ) + '"' );
        }

        if ( valid && image.createContentsJson && typeof image.createContentsJson === 'object' ) {
            valid = this.contentsJsonConfigIsValid(image.createContentsJson);

            if( !valid ) {
                console.log('The definition of createContentsJson on your image definition targeting ' +
                    ( image.targetPath || '(unknown)' ) + ' is invalid');
            }
        }

        return valid;
    }


    //------------------------------------------------------------------------------------------------------
    static contentsJsonConfigIsValid( config: IContentsJSONConfig): boolean
    //------------------------------------------------------------------------------------------------------
    {
        return (
            !stringIsEmpty(config.idiom) &&
            ['iphone', 'ipad', 'universal' ].indexOf(config.idiom) >= 0 &&
            !stringIsEmpty(config.scale) &&
            ['1x', '2x', '3x' ].indexOf(config.scale) >= 0
        );
    }
}