//----------------------------------------------------------------------------------------------------------
import * as fs from 'fs';
import * as path from 'path';
//----------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------
export class Configuration
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    configPath: string = null;
    error: string = null;

    private config: any;
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

        stat = fs.lstatSync(directory);

        if ( !stat.isDirectory() ) {
            return this.setError('The path: '+directory + ' is not a directory');
        }

        // FIXME: missing check for empty
        if ( !fileName ) {
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

        stat = fs.lstatSync(this.configPath);

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
    configForRule(rule: string): any[]
    //------------------------------------------------------------------------------------------------------
    {
        // FIXME: also return when rule string is empty
        if ( this.error ) {
            return [];
        }
        return this.config[rule] || [];
    }
}