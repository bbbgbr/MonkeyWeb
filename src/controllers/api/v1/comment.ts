import { Router } from 'express';
import { body, oneOf } from 'express-validator/check';
import { Comment as CommentManager } from '../../../repositories/v1/Comment';
import { CommentConfig } from '../../../repositories/v1/CommentConfig';
import { CommentText } from '../../../repositories/v1/CommentText';
import { commentImage, completionHandler, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/listText',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    (req, res) => {
        CommentText.getInstance().list().subscribe(
            (comments) => res.status(200).send({ comments }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/addText',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('text').isString(),
    (req, res) => {
        CommentText.getInstance().add(
            req.body.text,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/deletText',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('commentTextID').isInt(),
    (req, res) => {
        CommentText.getInstance().delete(
            req.body.commentTextID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/editText',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('commentTextID').isInt(),
    body('text').isString(),
    (req, res) => {
        CommentText.getInstance().edit(
            req.body.commentTextID,
            req.body.text,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/listConfig',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    (req, res) => {
        CommentConfig.getInstance().list(
            req.body.userID,
        ).subscribe(
            (configs) => res.status(200).send({ configs }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post(
    '/addConfig',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    body('commentTextID').isInt(),
    (req, res) => {
        CommentConfig.getInstance().add(
            req.body.userID,
            req.body.commentTextID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/deleteConfig',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('userID').isInt(),
    body('commentTextID').isInt(),
    (req, res) => {
        CommentConfig.getInstance().delete(
            req.body.userID,
            req.body.commentTextID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/add',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    commentImage,
    body('studentID').isInt(),
    body('commentTextID').isInt().optional(),
    body('quarterID').isInt(),
    body('senderID').isInt(),
    body('commentType').isString(),
    (req, res) => {
        CommentManager.getInstance().add(
            req.body.studentID,
            req.body.quarterID,
            req.body.senderID,
            req.body.commentType,
            {
                CommentTextID: req.body.commentTextID,
                ImagePath: req.file === undefined ? undefined : req.file.path,
            },
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/delete',
    validateUserPosition('admin', 'dev', 'mel'),
    body('commentID').isInt(),
    (req, res) => {
        CommentManager.getInstance().delete(
            req.body.commentID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/edit',
    validateUserPosition('admin', 'dev', 'mel'),
    body('commentID').isInt(),
    oneOf([
        body('commentType').isString(),
        body('commentTextID').isInt(),
        body('quarterID').isInt(),
        body('studentID').isInt(),
        body('remark').isString(),
        body('senderID').isInt(),
    ]),
    (req, res) => {
        CommentManager.getInstance().edit(
            req.body.commentID,
            {
                CommentTextID: req.body.commentTextID,
                CommentType: req.body.commentType,
                QuarterID: req.body.quarterID,
                Remark: req.body.remark,
                SenderID: req.body.senderID,
                StudentID: req.body.studentID,
            },
        ).subscribe(
            completionHandler(res),
        );
    },
);
