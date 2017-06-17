//----------------------------------------------------------------------------------------------------------
import * as commander from 'commander';
import {Configuration} from "../configuration";
import {Generator} from "../generator";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export class App
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    private program: commander.CommanderStatic;
    private package: any;

    private configuration: Configuration;
    private generator: Generator;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor()
    //------------------------------------------------------------------------------------------------------
    {
        this.program = commander;
        this.package = require('../../../package.json');
    }

    //------------------------------------------------------------------------------------------------------
    public initialize()
    //------------------------------------------------------------------------------------------------------
    {
        this.program
            .version(this.package.version)
            .description('An application for creating files from templates')
            .option('-c, --config-file [value]',
                'Set configuration file name (without .json) default will be appig.json')
            .option('-r, --rule [value]',
                'Will limit generation to one rule within the config file ' +
                'if the name of the role is given here')
            .option('-t, --target [value]',
                'Set target directory which is to top relative directory of ' +
                'each rule (./ is used as default)')
            .option('-d, --config-directory [value]',
                'The directory containing the config files (./ is used as default)')
            .parse(process.argv);
    }

    //------------------------------------------------------------------------------------------------------
    run()
    //------------------------------------------------------------------------------------------------------
    {
        let directory:string, filePath, rule, target;

        directory = this.program.configDirectory || process.cwd();
        filePath = this.program.configFile || null;
        rule = this.program.rule;
        target = this.program.target || null;

        this.configuration = new Configuration(directory, filePath);

        if ( this.configuration.error ) {
            return this.logError(this.configuration.error);
        }

        this.generator = new Generator({ config: this.configuration, rule: rule, target: target });

        if ( this.generator.error ) {
            return this.logError(this.generator.error);
        }
    }


    //------------------------------------------------------------------------------------------------------
    private logError(err: string)
    //------------------------------------------------------------------------------------------------------
    {
        console.error(err);
    }
}



//----------------------------------------------------------------------------------------------------------
let app = new App();
app.initialize();
app.run();
//----------------------------------------------------------------------------------------------------------
