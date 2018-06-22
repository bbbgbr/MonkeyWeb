import { Router } from 'express';
import { body, oneOf, param } from 'express-validator/check';
import { UserRegistrationStage } from '../../../models/v1/studentState';
import { UserStatus } from '../../../models/v1/user';
import { FileManager } from '../../../repositories/v1/FileManager';
import { User } from '../../../repositories/v1/User';
import { completionHandler, profileImage, validateFile, validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/listTutor',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    (req, res) => {
        User.getInstance().listTutors()
            .subscribe(
                (tutors) => res.status(200).send({ tutors }),
                (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/listStudent',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('quarterID').isInt(),
    body('userStatus').isIn(Object.keys(UserStatus)).optional(),
    body('registrationStage').isIn(Object.keys(UserRegistrationStage)).optional(),
    body('grade').isInt().optional(),
    validateRequest,
    (req, res) => {
        User.getInstance().listStudent(req.body.quarterID, {
            Grade: req.body.grade,
            Stage: req.body.registrationStage,
            UserStatus: req.body.userStatus,
        }).subscribe(
            (students) => res.status(200).send({ students }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/getAllStudent',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    (req, res) => {
        User.getInstance().getAllStudent().subscribe(
            (students) => res.status(200).send({ students }),
            (error) => res.status(500).send(error),
        );
    });

router.post(
    '/getUserInfo',
    validateUserPosition('student', 'tutor', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    validateRequest,
    (req, res) => {
        User.getInstance().getUserInfo(
            req.body.userID,
        ).subscribe(
            (user) => res.status(200).send({ user }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/decryptPassword',
    validateUserPosition('dev', 'mel'),
    body('userID').isInt(),
    validateRequest,
    (req, res) => {
        User.getInstance().decryptPassword(
            req.body.userID,
        ).subscribe(
            (password) => res.status(200).send({ password }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/addTutor',
    validateUserPosition('admin', 'dev', 'mel'),
    body('firstName').isString(),
    body('lastname').isString(),
    body('nickname').isString(),
    body('firstnameEn').isString(),
    body('lastnameEn').isString(),
    body('nicknameEn').isString(),
    body('email').isEmail(),
    body('phone').isMobilePhone('th-TH'),
    body('password').isString(),
    validateRequest,
    (req, res) => {
        User.getInstance().addTutor(
            req.body.firstName,
            req.body.lastname,
            req.body.nickname,
            req.body.firstnameEn,
            req.body.lastnameEn,
            req.body.nicknameEn,
            req.body.email,
            req.body.phone,
            req.body.password,
        ).subscribe(
            (userID) => res.status(200).send({ userID }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/edit',
    validateUserPosition('student', 'tutor', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    oneOf([
        body('firstName').isString(),
        body('lastname').isString(),
        body('nickname').isString(),
        body('firstnameEn').isString(),
        body('lastnameEn').isString(),
        body('nicknameEn').isString(),
        body('email').isEmail(),
        body('phone').isMobilePhone('th-TH'),
        body('password').isString(),
    ]),
    validateRequest,
    (req, res) => {
        // tslint:disable:object-literal-sort-keys
        User.getInstance().edit(
            req.body.userID,
            {
                Firstname: req.body.firstName,
                Lastname: req.body.lastname,
                Nickname: req.body.nickname,
                FirstnameEn: req.body.firstnameEn,
                LastnameEn: req.body.lastnameEn,
                NicknameEn: req.body.nicknameEn,
                Email: req.body.email,
                Phone: req.body.phone,
                UserPassword: req.body.password,
            },
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/generateStudent',
    validateUserPosition('admin', 'dev', 'mel'),
    (req, res) => {
        User.getInstance().addStudent(
        ).subscribe(
            (user) => res.status(200).send(user),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/register',
    validateUserPosition('student', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    body('firstName').isString(),
    body('lastname').isString(),
    body('nickname').isString(),
    body('firstnameEn').isString(),
    body('lastnameEn').isString(),
    body('nicknameEn').isString(),
    body('email').isEmail(),
    body('phone').isMobilePhone('th-TH'),
    body('grade').isInt({ min: 1, max: 12 }),
    body('quarterID').isInt(),
    validateRequest,
    (req, res) => {
        User.getInstance().registerStudent(
            req.body.userID,
            req.body.firstName,
            req.body.lastname,
            req.body.nickname,
            req.body.firstnameEn,
            req.body.lastnameEn,
            req.body.nicknameEn,
            req.body.email,
            req.body.phone,
            req.body.grade,
            req.body.quarterID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/uploadProfile',
    validateUserPosition('student', 'tutor', 'admin', 'dev', 'mel'),
    profileImage,
    body('userID').isInt(),
    validateFile,
    validateRequest,
    (req, res) => {
        FileManager.getInstance().uploadProfilePicture(req.body.userID, req.file).subscribe(
            completionHandler(res),
        );
    },
);

router.get(
    '/profile/:id',
    validateUserPosition('student', 'tutor', 'admin', 'dev', 'mel'),
    param('id').isInt(),
    validateRequest,
    (req, res) => {
        let imagePath: string;
        FileManager.getInstance().downloadProfilePicture(req.params.id).subscribe(
            (image) => {
                imagePath = image;
                res.status(200).sendFile(imagePath);
            },
            () => FileManager.sendNotFoundProfilePicture(res),
            () => FileManager.cleanUp(res, imagePath),
        );
    },
);
