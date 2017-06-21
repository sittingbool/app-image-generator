//----------------------------------------------------------------------------------------------------------
import {IComposeOptions, IGeneratorRule, IImageFileConfig} from "./configuration";
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

        return valid;
    }
}