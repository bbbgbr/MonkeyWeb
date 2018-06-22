import { from, Observable } from 'rxjs';
import * as Sequelize from 'sequelize';

declare global {
    type SequelizeAttributes<T extends { [key: string]: any }> = {
        [P in keyof T]: string | Sequelize.DataTypeAbstract | Sequelize.DefineAttributeColumnOptions;
    };
}

export class Connection {

    public static getInstance(): Connection {
        if (!this.instance) {
            this.instance = new Connection();
        }
        return this.instance;
    }

    private static instance: Connection;

    private sequelize: Sequelize.Sequelize;

    private constructor() {
        this.sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USERNAME,
            process.env.DB_PASSWORD, {
                dialect: 'mssql',
                dialectOptions: {
                    encrypt: true,
                },
                host: process.env.DB_SERVER,
                logging: false, // Enable sql logging
            });
    }

    public getConnection(): Sequelize.Sequelize {
        return this.sequelize;
    }

    public query<T>(sql: string | { query: string, values: any[] }, options?: Sequelize.QueryOptions): Observable<T[]> {
        return from(this.sequelize.query<T>(sql, options));
    }

    public authenticate() {
        this.sequelize.authenticate().then(() => {
            console.log('Success');
        }).catch((err) => {
            console.log(err);
        });
    }

}
