//----------------------------------------------------------------------------------------------------------
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export interface IContentsFileImageDefinition
//----------------------------------------------------------------------------------------------------------
{
    idiom: string;
    filename: string;
    scale: string;
}



//----------------------------------------------------------------------------------------------------------
export class ContentsFileUpdater
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    protected directories: string[]; // directories to be updated
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor()
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    addDirectory(path: string, alreadyCheckedExistence: boolean = false)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !alreadyCheckedExistence && !fs.existsSync(path) ) {
            return;
        }

        if ( this.directories.indexOf(path) >= 0 ) {
            return;
        }

        this.directories.push(path);
    }


    //------------------------------------------------------------------------------------------------------
    run()
    //------------------------------------------------------------------------------------------------------
    {
        this.directories.forEach( dir => {
            this.runForDirectory(dir);
        });
    }


    //------------------------------------------------------------------------------------------------------
    protected runForDirectory(directory: string)
    //------------------------------------------------------------------------------------------------------
    {
        let data, fileData: string, filePath = path.join(directory, 'Contents.json'),
            content: string[], currentImages = [];

        if ( fs.existsSync(filePath) ) {
            fileData = fs.readFileSync(filePath, 'uft8');

            try {
                data = JSON.parse(fileData);
            } catch ( err ) {
                console.log(err);
                return;
            }
        }

        content = fs.readdirSync(directory);

        content = content.filter(item => {
            let extension = path.extname(item).substring(1);
            return ( ! item.startsWith('.') &&
            ['jpeg', 'jpg', 'pdf', 'png', 'tiff'].indexOf(extension) >= 0 );
        });

        content.forEach(file => {
            let existing: IContentsFileImageDefinition =
                <IContentsFileImageDefinition>_.find(data.images, { filename: file });

            if ( ! existing ) {
                existing = { idiom: 'universal' , scale: '2x', filename: file };
            }

            currentImages.push(existing);
        });

        data.images = currentImages;

        try {
            fs.writeFileSync(filePath, JSON.stringify(data), { encoding: 'utf8' });
        } catch(err) {
            console.error('Could not create Contents.json in ' + directory + ' because: ' + err.message);
        }
    }
}