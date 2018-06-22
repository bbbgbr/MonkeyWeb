import * as Sequelize from 'sequelize';
import { quarterModel } from './quarter';

export interface IRoomName {
    RoomName: string;
}

export interface IRoom extends IRoomName {
    MaxSeat: number;
}

export interface IRoomModel extends IRoom {
    ID?: number;
    QuarterID: number;
}

export type RoomInstance = Sequelize.Instance<IRoomModel> & IRoomModel;

// tslint:disable:object-literal-sort-keys
export function roomModel(sequalize: Sequelize.Sequelize) {
    const attributes: SequelizeAttributes<IRoomModel> = {
        ID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        RoomName: {
            type: Sequelize.STRING(16),
            allowNull: false,
        },
        QuarterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: quarterModel(sequalize),
                key: 'ID',
            },
        },
        MaxSeat: {
            type: Sequelize.TINYINT,
            allowNull: true,
        },
    };

    return sequalize.define<RoomInstance, IRoomModel>('Room', attributes, {
        tableName: 'Room',
        timestamps: false,
    });
}
