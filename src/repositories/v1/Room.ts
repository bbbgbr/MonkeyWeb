import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';
import { IRoom, IRoomModel, RoomInstance, roomModel } from '../../models/v1/room';
import { Quarter } from './Quarter';

export class Room {

    public static getInstance(): Room {
        if (!this.instance) {
            this.instance = new Room();
        }
        return this.instance;
    }

    private static instance: Room;

    private roomModel: Sequelize.Model<RoomInstance, IRoomModel>;

    private constructor() {
        this.roomModel = roomModel(Connection.getInstance().getConnection());
    }

    public add(
        RoomName: string,
        QuarterID: number,
        MaxSeat: number,
    ): Observable<IRoomModel> {
        return from(this.roomModel.create(
            { RoomName, QuarterID, MaxSeat },
        ));
    }

    public list(
        QuarterID?: number,
    ): Observable<IRoom[]> {
        if (QuarterID) {
            return from(this.roomModel.findAll<IRoom>({
                attributes: ['RoomName', 'MaxSeat'],
                raw: true,
                where: { QuarterID },
            }));
        } else {
            return Connection.getInstance().query<IRoom>(
                'SELECT RoomName, MaxSeat ' +
                'FROM Room ' +
                'JOIN Quarter ON Room.QuarterID = Quarter.ID ' +
                'WHERE StartDate < CURRENT_TIMESTAMP AND EndDate > CURRENT_TIMESTAMP', {
                    model: this.roomModel,
                    raw: true,
                });
        }
    }

    public edit(
        ID: number,
        value: Partial<IRoomModel>,
    ): Observable<number> {
        let updateValue = {} as Partial<IRoomModel>;
        if (value.RoomName) {
            updateValue = { ...updateValue, RoomName: value.RoomName };
        }
        if (value.QuarterID) {
            updateValue = { ...updateValue, QuarterID: value.QuarterID };
        }
        if (value.MaxSeat) {
            updateValue = { ...updateValue, MaxSeat: value.MaxSeat };
        }
        return from(this.roomModel.update(updateValue, { where: { ID } }))
            .pipe(
                map((result) => result[0]),
        );
    }

    public delete(
        ID: number,
    ): Observable<number> {
        return from(this.roomModel.destroy({ where: { ID } }));
    }

}
