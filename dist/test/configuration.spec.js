"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const should = require("should");
const mocha_typescript_1 = require("mocha-typescript");
const configuration_1 = require("../src/configuration");
let ConfigurationTest = class ConfigurationTest {
    assert_load_configuration() {
        this.conf = new configuration_1.Configuration('.', null);
        should(this.conf.error).equal(null);
    }
    assert_load_configuration_relative() {
        this.conf = new configuration_1.Configuration('../../dist/test', null);
        should(this.conf.error).equal(null);
    }
    assert_load_configuration_absolute() {
        this.conf = new configuration_1.Configuration(__dirname, null);
        should(this.conf.error).equal(null);
    }
    assert_load_configuration_file() {
        let options;
        this.conf = new configuration_1.Configuration(__dirname, 'alternative_appig.json');
        should(this.conf.error).equal(null);
        options = this.conf.getGeneratorConfig();
        if (options) {
            should(options.rootPath).equal('Alt_Resources');
        }
    }
    assert_load_configuration_file_plain() {
        let options;
        this.conf = new configuration_1.Configuration(__dirname, 'alternative_appig');
        should(this.conf.error).equal(null);
        options = this.conf.getGeneratorConfig();
        if (options) {
            should(options.rootPath).equal('Alt_Resources');
        }
    }
    assert_load_configuration_err_dir_not_exists() {
        this.conf = new configuration_1.Configuration('i-dont-exist', 'alternative_appig');
        should(this.conf.error).not.equal(null);
        should(this.conf.error.indexOf('No such directory: /')).be.greaterThan(-1);
    }
    assert_load_configuration_err_file_not_exists() {
        this.conf = new configuration_1.Configuration(__dirname, 'i-dont-exist');
        should(this.conf.error).not.equal(null);
        should(this.conf.error.indexOf('no such file or directory')).be.greaterThan(-1);
    }
    assert_load_configuration_err_dir_not_dir() {
        this.conf = new configuration_1.Configuration(path.join(__dirname, 'alternative_appig.json'), null);
        should(this.conf.error).not.equal(null);
        should(this.conf.error.indexOf('is not a directory')).be.greaterThan(-1);
    }
    assert_load_configuration_err_file_not_file() {
        this.conf = new configuration_1.Configuration(path.join(__dirname, '..'), 'test');
        should(this.conf.error).not.equal(null);
        should(this.conf.error.indexOf('is not a file')).be.greaterThan(-1);
    }
    assert_load_generator_config() {
        let options;
        this.conf = new configuration_1.Configuration('.', null);
        should(this.conf.error).equal(null);
        options = this.conf.getGeneratorConfig();
        should((options && typeof options === 'object')).be.true;
        should(options.rootPath).equal('App_Resources');
    }
    assert_load_rule() {
        let ruleConfig;
        this.conf = new configuration_1.Configuration('.', null);
        should(this.conf.error).equal(null);
        ruleConfig = this.conf.configForRule('ios:app-icon');
        should((ruleConfig && typeof ruleConfig === 'object')).be.true;
        should(ruleConfig.sourceFile).equal('appIcon.png');
        should(ruleConfig.images.length).be.greaterThan(0);
    }
};
__decorate([
    mocha_typescript_1.test("load configuration from default path")
], ConfigurationTest.prototype, "assert_load_configuration", null);
__decorate([
    mocha_typescript_1.test("load configuration from relative path")
], ConfigurationTest.prototype, "assert_load_configuration_relative", null);
__decorate([
    mocha_typescript_1.test("load configuration from absolute path")
], ConfigurationTest.prototype, "assert_load_configuration_absolute", null);
__decorate([
    mocha_typescript_1.test("load configuration from custom file")
], ConfigurationTest.prototype, "assert_load_configuration_file", null);
__decorate([
    mocha_typescript_1.test("load configuration from custom file without file ending")
], ConfigurationTest.prototype, "assert_load_configuration_file_plain", null);
__decorate([
    mocha_typescript_1.test("should error when directory not existing ")
], ConfigurationTest.prototype, "assert_load_configuration_err_dir_not_exists", null);
__decorate([
    mocha_typescript_1.test("should error when file not existing ")
], ConfigurationTest.prototype, "assert_load_configuration_err_file_not_exists", null);
__decorate([
    mocha_typescript_1.test("should error when directory not a directory ")
], ConfigurationTest.prototype, "assert_load_configuration_err_dir_not_dir", null);
__decorate([
    mocha_typescript_1.test("should error when directory not a directory ")
], ConfigurationTest.prototype, "assert_load_configuration_err_file_not_file", null);
__decorate([
    mocha_typescript_1.test("should load the generator options")
], ConfigurationTest.prototype, "assert_load_generator_config", null);
__decorate([
    mocha_typescript_1.test("should load the generator options")
], ConfigurationTest.prototype, "assert_load_rule", null);
ConfigurationTest = __decorate([
    mocha_typescript_1.suite
], ConfigurationTest);
//# sourceMappingURL=configuration.spec.js.map