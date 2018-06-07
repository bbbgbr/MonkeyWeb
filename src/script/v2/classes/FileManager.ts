import { ensureDirSync, moveSync, removeSync } from "fs-extra";
import { SlideshowManager } from "./SlideshowManager";

export class FileManager {

    static addSlideshowImage(files: Express.Multer.File[]) {
        ensureDirSync(process.env.SLIDESHOW_PATH);
        files.forEach(file => {
            moveSync(file.path, SlideshowManager.getPath(file.filename));
        });
    }

    static removeSlideshowImage(path: string) {
        removeSync(path);
    }
}