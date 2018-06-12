import { Router } from 'express';
import { body } from 'express-validator/check';
import Auth from '../../../Auth';
import { validateRequest } from '../../ApiHandler';
import { router as attendance } from './attendance';
import { router as chat } from './chat';
import { router as course } from './class';
import { router as classlog } from './classlog';
import { router as comment } from './comment';
import { router as portfolio } from './portfolio';
import { router as quarter } from './quarter';
import { router as room } from './room';
import { router as sheet } from './sheet';
import { router as studentState } from './studentState';
import { router as user } from './user';

export const router = Router();

router.use('/attendance', attendance);
router.use('/chat', chat);
router.use('/class', course);
router.use('/classlog', classlog);
router.use('/comment', comment);
router.use('/portfolio', portfolio);
router.use('/quarter', quarter);
router.use('/room', room);
router.use('/sheet', sheet);
router.use('/studentState', studentState);
router.use('/user', user);

router.post(
    '/login',
    body('userID').isInt(),
    body('password').isString(),
    validateRequest,
    (req, res) => {
        Auth.login(req.body.userID, req.body.password).subscribe(
            (token) => res.status(200).send(token),
            (error) => res.sendStatus(401),
        );
    },
);

router.post(
    '/token',
    body('refreshToken').isString(),
    validateRequest,
    (req, res) => {
        const newToken = Auth.refresh(req.body.refreshToken);
        if (newToken) {
            return res.status(200).send(newToken);
        } else {
            return res.sendStatus(401);
        }
    },
);
