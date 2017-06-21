"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const sb_util_ts_1 = require("sb-util-ts");
class ContentsFileUpdater {
    constructor() {
        this.directories = [];
        this.fileConfigs = {};
    }
    addDirectory(path, alreadyCheckedExistence = false) {
        if (!alreadyCheckedExistence && !fs.existsSync(path)) {
            return;
        }
        if (this.directories.indexOf(path) >= 0) {
            return;
        }
        this.directories.push(path);
    }
    addConfigForFile(filePath, config) {
        if (sb_util_ts_1.stringIsEmpty(filePath) || !filePath.startsWith('/')) {
            return console.log('Tried to add an invalid file definition to create Contents.json for file '
                + filePath);
        }
        this.fileConfigs[filePath] = config;
    }
    run() {
        if (this.directories.length < 1) {
            return;
        }
        this.directories.forEach(dir => {
            this.runForDirectory(dir);
        });
    }
    runForDirectory(directory) {
        let data, fileData, filePath = path.join(directory, 'Contents.json'), content, currentImages = [];
        if (fs.existsSync(filePath)) {
            fileData = fs.readFileSync(filePath, 'utf8');
            try {
                data = JSON.parse(fileData);
            }
            catch (err) {
                console.log(err);
                return;
            }
        }
        else {
            data = {
                images: [],
                info: {
                    version: 1,
                    author: "xcode"
                }
            };
        }
        content = fs.readdirSync(directory);
        content = content.filter(item => {
            let extension = path.extname(item).substring(1);
            return (!item.startsWith('.') &&
                ['jpeg', 'jpg', 'pdf', 'png', 'tiff'].indexOf(extension) >= 0);
        });
        content.forEach(file => {
            let existing = _.find(data.images, { filename: file });
            let fileConfig = this.fileConfigs[path.join(directory, file)] || { idiom: 'universal', scale: '2x' };
            if (!existing) {
                existing = { idiom: fileConfig.idiom, scale: fileConfig.scale, filename: file };
            }
            else {
                existing.idiom = fileConfig.idiom;
                existing.scale = fileConfig.scale;
            }
            currentImages.push(existing);
        });
        data.images = currentImages;
        try {
            fileData = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, fileData, { encoding: 'utf8', flag: 'w' });
            console.log('Updated Contents.json in ' + path.dirname(filePath));
        }
        catch (err) {
            console.error('Could not create Contents.json in ' + directory + ' because: ' + err.message);
        }
    }
}
exports.ContentsFileUpdater = ContentsFileUpdater;
//# sourceMappingURL=contents-json-updater.js.map