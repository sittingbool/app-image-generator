//import * as rimraf from 'rimraf';
import * as path from 'path';

import { suite, test} from "mocha-typescript";
import { slow, timeout, skip, only } from "mocha-typescript"; // only for testing unconventional behaviour or single functions, see https://www.npmjs.com/package/mocha-typescript
import {Configuration} from "../src/configuration";

@suite
class ConfigurationTest {

    @test("load configuration from default path")
    assert_load_configuration(done: Function) {
        let conf = new Configuration(__dirname);

    }
}