import * as commander from 'commander';

export class App {

    private program: commander.CommanderStatic;
    private package: any;

    constructor() {
        this.program = commander;
        this.package = require('../../package.json');
    }

    public initialize() {
        this.program
            .version(this.package.version)
            .description('An application for creating files from templates')
            .option('-c, --config-file [value]', 'Set configuration file name (without .json) default will be appig.json')
            .option('-r, --rule [value]', 'Will limit generation to one rule within the config file if the name of the role is given here')
            .option('-t, --target [value]', 'Set target directory which is to top relative directory of each rule (./ is used as default)')
            .option('-cd, --config-directory [value]', 'The directory containing the config files (./ is used as default)')
            .parse(process.argv);
    }

}

let app = new App();
app.initialize();
