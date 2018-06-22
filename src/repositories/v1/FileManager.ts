import { BlobService, createBlobService } from 'azure-storage';
import { Response } from 'express';
import { removeSync } from 'fs-extra';
import { join } from 'path';
import { Observable } from 'rxjs';

export class FileManager {

    public static getInstance(): FileManager {
        if (!this.instance) {
            this.instance = new FileManager();
        }
        return this.instance;
    }

    public static cleanUp(res: Response, path: string) {
        res.on('finish', () => {
            removeSync(path);
        });
    }

    public static sendNotFoundProfilePicture(res: Response): void {
        res.status(404).sendFile(this.assetPath('profile') + '/blank-profile.jpg');
    }

    public static sendNotFoundAttendanceImage(res: Response): void {
        res.status(404).sendFile(this.assetPath('attendance') + '/not-found.jpg');
    }

    private static instance: FileManager;

    private static assetPath(folder: string): string {
        return join(__dirname, '../assets/', folder);
    }

    private blobService: BlobService;

    private constructor() {
        this.blobService = createBlobService();
    }

    public uploadProfilePicture(userID: string, image: Express.Multer.File): Observable<BlobService.BlobResult> {
        return this.uploadAndRemove(userID, 'profile-picture', image);
    }

    public downloadProfilePicture(userID: string): Observable<string> {
        return this.download(userID, 'profile-picture', join(FileManager.assetPath('profile'), userID + '.jpg'));
    }

    public uploadAttendanceImage(fileName: string, image: Express.Multer.File): Observable<BlobService.BlobResult> {
        return this.uploadAndRemove(fileName, 'attendance', image);
    }

    public downloadAttendanceImage(fileName: string): Observable<string> {
        return this.download(fileName, 'attendance', FileManager.assetPath('attendance') + fileName + '.jpg');
    }

    private uploadAndRemove(fileName: string, container: string, file: Express.Multer.File): Observable<BlobService.BlobResult> {
        return new Observable((observer) => {
            this.blobService.createAppendBlobFromLocalFile(container, fileName, file.path, (error, result) => {
                if (error) {
                    observer.error(error);
                } else {
                    removeSync(file.path);
                    observer.next(result);
                    observer.complete();
                }
            });
        });
    }

    private download(key: string, container: string, tempPath: string): Observable<string> {
        return new Observable((observer) => {
            this.blobService.getBlobToLocalFile(container, key, tempPath, (error) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(tempPath);
                    observer.complete();
                }
            });
        });
    }
}
