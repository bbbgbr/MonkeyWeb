import { Router } from 'express';
import { body, oneOf } from 'express-validator/check';
import { UserRegistrationStage } from '../../../models/v1/studentState';
import { StudentState } from '../../../repositories/v1/StudentState';
import { validateRequest, validateUserPosition } from '../../ApiHandler';

export const router = Router();

router.post(
    '/edit',
    validateUserPosition('admin', 'dev', 'mel'),
    body('studentID').isInt(),
    body('quarterID').isInt(),
    oneOf([
        body('grade').isInt({ min: 1, max: 12 }),
        body('remark').isString(),
        body('stage').isIn(Object.keys(UserRegistrationStage)),
        body('level').isString(),
    ]),
    validateRequest,
    (req, res) => {
        StudentState.getInstance().edit(
            req.body.studentID,
            req.body.quarterID,
            {
                Grade: req.body.grade,
                Remark: req.body.remark,
                Stage: req.body.stage,
                StudentLevel: req.body.level,
            },
        );
    },
);
