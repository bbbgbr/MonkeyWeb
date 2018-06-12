import { Router } from 'express';
import { body, oneOf, param } from 'express-validator/check';
import { Observable } from 'rxjs';
import { Attendance } from '../../../repositories/v1/Attendance';
import { FileManager } from '../../../repositories/v1/FileManager';
import { attendanceDocument, completionHandler, validateNumberArray, validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/add',
    validateUserPosition('student', 'admin', 'dev', 'mel'),
    attendanceDocument,
    body('studentID').isInt(),
    oneOf([
        body('classID').isInt(),
        body('classID').custom(validateNumberArray),
    ]),
    body('attendanceDate').isISO8601(),
    body('attendanceType').isString(),
    body('reason').isString(),
    body('sender').isString(),
    validateRequest,
    (req, res) => {
        let observable: Observable<any>;
        if (req.body.classID instanceof Array) {
            observable = Attendance.getInstance().bulkAdd(
                req.body.studentID,
                req.body.classID,
                req.body.attendanceDate,
                req.body.attendanceType,
                req.body.reason,
                req.body.sender,
                req.file === undefined ? undefined : req.file,
            );
        } else {
            observable = Attendance.getInstance().add(
                req.body.studentID,
                req.body.classID,
                req.body.attendanceDate,
                req.body.attendanceType,
                req.body.reason,
                req.body.sender,
                req.file === undefined ? undefined : req.file,
            );
        }
        observable.subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/addWithPath',
    validateUserPosition('student', 'admin', 'dev', 'mel'),
    body('studentID').isInt(),
    oneOf([
        body('classID').isInt(),
        body('classID').custom(validateNumberArray),
    ]),
    body('attendanceDate').isISO8601(),
    body('attendanceType').isString(),
    body('reason').isString(),
    body('sender').isString(),
    body('path').isString(),
    validateRequest,
    (req, res) => {
        Attendance.getInstance().add(
            req.body.studentID,
            req.body.classID,
            req.body.attendanceDate,
            req.body.attendanceType,
            req.body.reason,
            req.body.sender,
            req.body.path,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.get(
    '/image/:id',
    validateUserPosition('student', 'admin', 'dev', 'mel'),
    param('id').isInt(),
    validateRequest,
    (req, res) => {
        let imagePath: string;
        Attendance.getInstance().getPath(
            req.params.id,
        ).subscribe(
            (image) => {
                imagePath = image;
                res.status(200).sendFile(image);
            },
            () => FileManager.sendNotFoundAttendanceImage(res),
            () => FileManager.cleanUp(res, imagePath),
        );
    },
);

router.post(
    '/delete',
    validateUserPosition('admin', 'dev', 'mel'),
    body('attendanceID').isInt(),
    validateRequest,
    (req, res) => {
        Attendance.getInstance().delete(
            req.body.attendanceID,
        ).subscribe(
            completionHandler(res),
        );
    },
);
