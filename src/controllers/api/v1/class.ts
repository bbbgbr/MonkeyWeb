import { Router } from 'express';
import { body, oneOf } from 'express-validator/check';
import { Observable } from 'rxjs';
import { Class } from '../../../repositories/v1/Class';
import { ClassRegistration } from '../../../repositories/v1/ClassRegistration';
import { completionHandler, validateNumberArray, validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/addCourse',
    validateUserPosition('admin', 'dev', 'mel'),
    body('className').isString(),
    body('quarterID').isInt(),
    body('classDate').isISO8601(),
    body('classSubject').isString(),
    body('grade').isString().optional(),
    body('tutorID').isInt().optional(),
    body('classTimes').isInt().optional(),
    validateRequest,
    (req, res) => {
        Class.getInstance().addCourse(
            req.body.className,
            req.body.quarterID,
            req.body.classDate,
            req.body.classSubject,
            req.body.grade,
            req.body.tutorID,
            req.body.classTimes,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/addHybrid',
    validateUserPosition('admin', 'dev', 'mel'),
    body('className').isString(),
    body('quarterID').isInt(),
    body('classDate').isISO8601(),
    body('classSubject').isString(),
    validateRequest,
    (req, res) => {
        Class.getInstance().addHybrid(
            req.body.className,
            req.body.quarterID,
            req.body.classDate,
            req.body.classSubject,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/addSkill',
    validateUserPosition('admin', 'dev', 'mel'),
    body('className').isString(),
    body('quarterID').isInt(),
    body('classDate').isISO8601(),
    body('classSubject').isString(),
    validateRequest,
    (req, res) => {
        Class.getInstance().addSkill(
            req.body.className,
            req.body.quarterID,
            req.body.classDate,
            req.body.classSubject,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/register',
    validateUserPosition('student', 'admin', 'dev', 'mel'),
    body('studentID').isInt(),
    oneOf([
        body('classID').isInt(),
        body('classesID').custom(validateNumberArray),
    ]),
    validateRequest,
    (req, res) => {
        let observer: Observable<any>;
        if (req.body.classesID) {
            observer = ClassRegistration.getInstance().bulkAdd(
                req.body.studentID,
                req.body.classesID,
            );
        } else {
            observer = ClassRegistration.getInstance().add(
                req.body.studentID,
                req.body.classID,
            );
        }
        observer.subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/unregistration',
    validateUserPosition('admin', 'dev', 'mel'),
    body('studentID').isInt(),
    body('classID').isInt(),
    validateRequest,
    (req, res) => {
        ClassRegistration.getInstance().deleteByClass(
            req.body.studentID,
            req.body.classID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/getClass',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('className').isString().optional(),
    body('quarterID').isInt().optional(),
    body('classDate').isISO8601().optional(),
    body('classSubject').isString().optional(),
    body('classType').isString().optional(),
    validateRequest,
    (req, res) => {
        Class.getInstance().getClass(
            req.body.className,
            req.body.quarterID,
            req.body.classDate,
            req.body.classSubject,
            req.body.classType,
        ).subscribe(
            (result) => res.status(200).send(result),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/delete',
    validateUserPosition('admin', 'dev', 'mel'),
    body('classID').isInt(),
    validateRequest,
    (req, res) => {
        Class.getInstance().deleteClass(
            req.body.classID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/edit',
    validateUserPosition('admin', 'dev', 'mel'),
    body('classID').isInt(),
    oneOf([
        body('classDate').isISO8601(),
        body('classDescripion').isString(),
        body('className').isString(),
        body('classSubject').isString(),
        body('classTime').isInt(),
        body('classType').isString(),
        body('grade').isString(),
        body('quarterID').isInt(),
        body('roomID').isInt(),
        body('suggestion').isString(),
        body('tutorID').isInt(),
    ]),
    validateRequest,
    (req, res) => {
        Class.getInstance().edit(
            req.body.classID,
            {
                ClassDate: req.body.classDate,
                ClassDescription: req.body.classDescripion,
                ClassName: req.body.className,
                ClassSubject: req.body.classSubject,
                ClassTimes: req.body.classTime,
                ClassType: req.body.classType,
                Grade: req.body.grade,
                QuarterID: req.body.quarterID,
                RoomID: req.body.roomID,
                Suggestion: req.body.suggestion,
                TutorID: req.body.tutorID,
            },
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/info',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('classID').isInt(),
    validateRequest,
    (req, res) => {
        Class.getInstance().getClassInfo(
            req.body.classID,
        ).subscribe(
            (result) => res.status(200).send(result),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/list',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('quarterID').isInt(),
    body('type').isIn(['Course', 'Hybrid', 'Skill']).optional(),
    validateRequest,
    (req, res) => {
        Class.getInstance().list(
            req.body.quarterID,
            req.body.type,
        ).subscribe(
            (classes) => res.status(200).send({ classes }),
            (error) => res.status(500).send(error),
        );
    },
);
