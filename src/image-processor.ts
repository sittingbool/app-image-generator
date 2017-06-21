//----------------------------------------------------------------------------------------------------------
import {IComposeOptions, IContentsJSONConfig} from "./configuration";
import {arrayIsEmpty, stringIsEmpty} from "sb-util-ts";
import * as path from "path";
import * as fs from "fs";
import * as gm from "gm";
import * as mkdirp from "mkdirp";
import * as _ from "lodash";
import * as hex2rgb from "hex-rgb";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export interface IImageProcessOptions
//----------------------------------------------------------------------------------------------------------
{
    original: string;
    target: string;
    size: string;
    noCrop?: boolean;
    createContentsJson?: IContentsJSONConfig; // determines if a contents.json for Apple should be created
    colorize?: string; // calculated color shift
    fillColor?: string; // color to be filled on any pixel that is not transparent

    compose?: IComposeOptions; // add a second image as composition
}


//----------------------------------------------------------------------------------------------------------
export class ImageProcess
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
                    .crop(relativeWidth, relativeHeight);


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

        if ( this.options.compose && typeof this.options.compose === 'object' ) {
            process = this.compose(process, this.options.compose);
            this.optionalsUsed = true;
        }

        return process;
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * adds optional image composition to the image
     * @param process - the gm process to be used as basis
     * @param options - IComposeOptions for this composition
     * @return {any} - altered gm process
     */
    compose(process: any, options: IComposeOptions): any
    //------------------------------------------------------------------------------------------------------
    {
        let geometry = "", composePath;

        let directionForValue = (value) => {
            if ( value >= 0) {
                return '+';
            }
            return '-';
        };

        composePath = path.join(path.dirname(this.options.original), options.composeImage);

        if ( !fs.existsSync(composePath) ) {
            console.log("Cannot find path " + composePath +
                " to compose with " + this.options.original + ", so skipping it.");

            return process;
        }

        if ( ! stringIsEmpty( options.size) ) {
            geometry += options.size;
        }

        if ( typeof options.offsetX === 'number' ) {
            geometry += directionForValue(options.offsetX) + options.offsetX;
        }

        if ( typeof options.offsetY === 'number' ) {
            geometry += directionForValue(options.offsetY) + options.offsetY;
        }

        process = process.composite(composePath);

        if ( !stringIsEmpty(geometry) ) {
            process = process.geometry(geometry);
        }

        return process;
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * executes write to file
     * @param process - gm process that was defined before and should be executed
     * @param callback - default callback
     * @param updateContentFiles - if set o true the Contents.json will be created here
     */
    protected runWrite(process: any, callback: (err: string) => void, updateContentFiles = false): any
    //------------------------------------------------------------------------------------------------------
    {
        process.write( this.options.target, function (err) {
            if ( err ) {
                return callback(err.message);
            }

            if ( updateContentFiles ) {

            }

            callback(null);
        });
    }
}