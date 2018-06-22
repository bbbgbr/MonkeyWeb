import { Router } from 'express';
import { body } from 'express-validator/check';
import { Sheet } from '../../../repositories/v1/Sheet';
import { completionHandler, validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/addSheet',
    validateUserPosition('tutor', 'admin', 'dev', 'mel'),
    body('subject').isString().isLength({ min: 1, max: 1 }),
    body('class').isString().isLength({ min: 1, max: 1 }),
    body('topic').isString().isLength({ min: 1, max: 3 }),
    body('level').isString().isLength({ min: 1, max: 1 }),
    body('number').isInt().isLength({ min: 1, max: 2 }),
    body('subLevel').isString().isLength({ min: 1, max: 2 }).optional(),
    body('rev').isNumeric().isLength({ min: 3, max: 3 }).optional(),
    body('topicName').isString().optional(),
    body('path').isString(),
    validateRequest,
    (req, res) => {
        Sheet.getInstance().addSheetWithTopic(
            req.body.subject,
            req.body.class,
            req.body.topic,
            req.body.level,
            req.body.number,
            req.body.subLevel || null,
            req.body.rev || null,
            req.body.topicName || null,
            req.body.path,
        ).subscribe(
            completionHandler(res),
        );
    },
);
