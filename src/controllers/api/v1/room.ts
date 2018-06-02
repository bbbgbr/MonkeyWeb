import { Router } from 'express';
import { body, oneOf } from 'express-validator/check';
import { Observable } from 'rxjs';
import { Room } from '../../../repositories/v1/Room';
import { completionHandler, validateRequest } from '../../ApiHandler';

export const router = Router();

router.post('/list',
    body('quarterID').isInt(),
    (req, res) => {
        Room.getInstance().list(
            req.body.quarterID,
        ).subscribe(
            (rooms) => res.status(200).send({ rooms }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post('/add',
    body('roomName').isString(),
    body('quarterID').isInt(),
    body('maxSeat').isInt(),
    validateRequest,
    (req, res) => {
        Room.getInstance().add(
            req.body.roomName,
            req.body.quarterID,
            req.body.maxSeat,
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post('/edit',
    body('roomID').isInt(),
    oneOf([
        body('roomName').isString(),
        body('quarterID').isInt(),
        body('maxSeat').isInt(),
    ]),
    validateRequest,
    (req, res) => {
        Room.getInstance().edit(
            req.body.roomID,
            {
                MaxSeat: req.body.maxSeat,
                QuarterID: req.body.quarterID,
                RoomName: req.body.roomName,
            },
        ).subscribe(
            completionHandler(res),
        );
    },
);

router.post('/delete',
    body('roomID').isInt(),
    validateRequest,
    (req, res) => {
        Room.getInstance().delete(
            req.body.roomID,
        ).subscribe(
            completionHandler(res),
        );
    },
);
