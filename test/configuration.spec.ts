//import * as rimraf from 'rimraf';
import * as path from 'path';
import * as should from 'should';

import { suite, test} from "mocha-typescript";
import { slow, timeout, skip, only } from "mocha-typescript"; // only for testing unconventional behaviour or single functions, see https://www.npmjs.com/package/mocha-typescript
import {Configuration} from "../src/configuration";

@suite
class ConfigurationTest {

    conf: Configuration;

    @test("load configuration from default path")
    assert_load_configuration() {
        this.conf = new Configuration('.', null);

        should(this.conf.error).equal(null);
    }

    @test("load configuration from relative path")
    assert_load_configuration_relative() {
        this.conf = new Configuration('../../dist/test', null);

        should(this.conf.error).equal(null);
    }

    @test("load configuration from absolute path")
    assert_load_configuration_absolute() {
        this.conf = new Configuration(__dirname, null);

        should(this.conf.error).equal(null);
    }

    @test("load configuration from custom file")
    assert_load_configuration_file() {
        let options;
        this.conf = new Configuration(__dirname, 'alternative_appig.json');

        should(this.conf.error).equal(null);

        options = this.conf.getGeneratorConfig();

        if ( options ) {

            should(options.rootPath).equal('Alt_Resources');
        }
    }

    @test("load configuration from custom file without file ending")
    assert_load_configuration_file_plain() {
        let options;
        this.conf = new Configuration(__dirname, 'alternative_appig');

        should(this.conf.error).equal(null);

        options = this.conf.getGeneratorConfig();

        if ( options ) {

            should(options.rootPath).equal('Alt_Resources');
        }
    }

    @test("should error when directory not existing ")
    assert_load_configuration_err_dir_not_exists() {

        this.conf = new Configuration('i-dont-exist', 'alternative_appig');

        should(this.conf.error).not.equal(null);

        should(this.conf.error.indexOf('No such directory: /')).be.greaterThan(-1);
    }

    @test("should error when file not existing ")
    assert_load_configuration_err_file_not_exists() {

        this.conf = new Configuration(__dirname, 'i-dont-exist');

        should(this.conf.error).not.equal(null);

        should(this.conf.error.indexOf('no such file or directory')).be.greaterThan(-1);
    }

    @test("should error when directory not a directory ")
    assert_load_configuration_err_dir_not_dir() {

        this.conf = new Configuration(path.join(__dirname, 'alternative_appig.json'), null);

        should(this.conf.error).not.equal(null);

        should(this.conf.error.indexOf('is not a directory')).be.greaterThan(-1);
    }

    @test("should error when directory not a directory ")
    assert_load_configuration_err_file_not_file() {

        this.conf = new Configuration(path.join(__dirname, '..'), 'test');

        should(this.conf.error).not.equal(null);

        should(this.conf.error.indexOf('is not a file')).be.greaterThan(-1);
    }

    @test("should load the generator options")
    assert_load_generator_config() {

        let options;

        this.conf = new Configuration('.', null);

        should(this.conf.error).equal(null);

        options = this.conf.getGeneratorConfig();

        should( (options && typeof options === 'object' ) ).be.true;

        should(options.rootPath).equal('App_Resources');
    }

    @test("should load the generator options")
    assert_load_rule() {

        let ruleConfig;

        this.conf = new Configuration('.', null);

        should(this.conf.error).equal(null);

        ruleConfig = this.conf.configForRule('ios:app-icon');

        should( (ruleConfig && typeof ruleConfig === 'object' ) ).be.true;

        should(ruleConfig.sourceFile).equal('appIcon.png');
        should(ruleConfig.images.length).be.greaterThan(0);
    }
}