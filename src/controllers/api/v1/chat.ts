import { Router } from 'express';
import { body, oneOf } from 'express-validator/check';
import { Chat } from '../../../repositories/v1/Chat';
import { completionHandler, validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/add',
    validateUserPosition('admin', 'dev', 'mel'),
    body('studentID').isInt(),
    body('chatMessage').isString(),
    body('quarterID').isInt(),
    body('senderID').isInt(),
    validateRequest,
    (req, res) => {
        Chat.getInstance().add(
            req.body.studentID,
            req.body.chatMessage,
            req.body.quarterID,
            req.body.senderID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/delete',
    validateUserPosition('admin', 'dev', 'mel'),
    body('chatID').isInt(),
    validateRequest,
    (req, res) => {
        Chat.getInstance().delete(
            req.body.chatID,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post(
    '/edit',
    validateUserPosition('admin', 'dev', 'mel'),
    body('chatID').isInt(),
    oneOf([
        body('chatMessage').isString(),
        body('senderID').isInt(),
        body('quarterID').isInt(),
        body('studentID').isInt(),
    ]),
    validateRequest,
    (req, res) => {
        Chat.getInstance().edit(
            req.body.chatID,
            {
                ChatMessage: req.body.chatMessage,
                QuarterID: req.body.quarterID,
                SenderID: req.body.senderID,
                StudentID: req.body.studentID,
            },
        );
    },
);

router.post(
    '/list',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('studentID').isInt(),
    body('limit').isInt().optional(),
    validateRequest,
    (req, res) => {
        Chat.getInstance().list(
            req.body.studentID,
            req.body.limit,
        ).subscribe(
            (chats) => res.status(200).send({ chats }),
            (error) => res.status(500).send(error),
        );
    },
);
