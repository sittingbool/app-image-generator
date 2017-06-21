"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
class ContentsFileUpdater {
    constructor() {
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
    run() {
        this.directories.forEach(dir => {
            this.runForDirectory(dir);
        });
    }
    runForDirectory(directory) {
        let data, fileData, filePath = path.join(directory, 'Contents.json'), content, currentImages = [];
        if (fs.existsSync(filePath)) {
            fileData = fs.readFileSync(filePath, 'uft8');
            try {
                data = JSON.parse(fileData);
            }
            catch (err) {
                console.log(err);
                return;
            }
        }
        content = fs.readdirSync(directory);
        content = content.filter(item => {
            let extension = path.extname(item).substring(1);
            return (!item.startsWith('.') &&
                ['jpeg', 'jpg', 'pdf', 'png', 'tiff'].indexOf(extension) >= 0);
        });
        content.forEach(file => {
            let existing = _.find(data.images, { filename: file });
            if (!existing) {
                existing = { idiom: 'universal', scale: '2x', filename: file };
            }
            currentImages.push(existing);
        });
        data.images = currentImages;
        try {
            fs.writeFileSync(filePath, JSON.stringify(data), { encoding: 'utf8' });
        }
        catch (err) {
            console.error('Could not create Contents.json in ' + directory + ' because: ' + err.message);
        }
    }
}
exports.ContentsFileUpdater = ContentsFileUpdater;
//# sourceMappingURL=contents-json-updater.js.map