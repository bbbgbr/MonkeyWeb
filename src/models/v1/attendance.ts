import * as Sequelize from 'sequelize';
import { classModel } from './class';
import { userModel } from './user';

export interface IAttendanceModel {
    ID?: number;
    AttendanceTimestamp?: Date;
    StudentID: number;
    ClassID: number;
    AttendanceDate: Date;
    AttendanceType: string;
    Reason?: string;
    Remark?: string;
    Sender?: string;
    AttendanceDocument?: string;
}

export type AttendanceInstance = Sequelize.Instance<IAttendanceModel> & IAttendanceModel;

// tslint:disable:object-literal-sort-keys
export function attendanceModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IAttendanceModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        AttendanceTimestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: new Date(),
        },
        StudentID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: userModel(sequalize),
                key: 'ID',
            },
        },
        ClassID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: classModel(sequalize),
                key: 'ID',
            },
        },
        AttendanceDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        AttendanceType: {
            type: Sequelize.STRING(8),
            allowNull: false,
        },
        Reason: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        Remark: {
            type: Sequelize.STRING(2),
            allowNull: true,
        },
        Sender: {
            type: Sequelize.STRING(64),
            allowNull: true,
        },
        AttendanceDocument: {
            type: Sequelize.STRING(128),
            allowNull: true,
        },
    };

    return sequalize.define<AttendanceInstance, IAttendanceModel>('Attendance', attributes, {
        tableName: 'Attendance',
        timestamps: false,
    });
}
