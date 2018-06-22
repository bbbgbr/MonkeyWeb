import * as Sequelize from 'sequelize';
import { Connection } from '../../models/Connection';

export class ClassTemplate {

    public static getInstance(): ClassTemplate {
        if (!this.instance) {
            this.instance = new ClassTemplate();
        }
        return this.instance;
    }

    private static instance: ClassTemplate;

    // private templateModel: Sequelize.Model<TemplateInstance, ITemplateModel>;

    private constructor() {
        // this.templateModel = templateModel(Connection.getInstance().getConnection());
    }
}
