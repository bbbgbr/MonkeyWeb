import * as Sequelize from 'sequelize';
import { userModel } from './user';

export enum TutorLogStatus {
    pending = 'pending',
    complete = 'complete',
}

export enum TutorLogDetail {
    none = 'none',
    course = 'course',
    hybrid = 'hybrid',
    sheet = 'sheet',
    com = 'com',
    reading = 'reading',
}

export interface ITutorLogModel {
    ID?: number;
    UserID: number;
    TutorLogDate: Date;
    CheckIn: Date;
    CheckOut?: Date;
    LastEdited: Date;
    EditedBy?: number;
    Detail0?: TutorLogDetail;
    Detail1?: TutorLogDetail;
    Detail2?: TutorLogDetail;
    Detail3?: TutorLogDetail;
    Detail4?: TutorLogDetail;
    TutorLogStatus?: TutorLogStatus;
}

export type TemplateInstance = Sequelize.Instance<ITutorLogModel> & ITutorLogModel;

// tslint:disable:object-literal-sort-keys
export function tutorLogModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<ITutorLogModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        UserID: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        TutorLogDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        CheckIn: {
            type: Sequelize.TIME,
            allowNull: false,
        },
        CheckOut: {
            type: Sequelize.TIME,
            allowNull: true,
        },
        LastEdited: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        EditedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        Detail0: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        Detail1: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        Detail2: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        Detail3: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        Detail4: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        TutorLogStatus: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
    };

    return sequalize.define<TemplateInstance, ITutorLogModel>('TutorLog', attributes, {
        tableName: 'TutorLog',
        timestamps: false,
    });
}
