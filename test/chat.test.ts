import { config } from 'dotenv';
import { join } from 'path';
process.env = config({ path: join(__dirname, '../test.env') }).parsed;
import * as request from 'supertest';
import app from '../src/controllers/Controller';

describe('POST /api/v1/chat/add', () => {

    test('empty body with no header\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/chat/add')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .expect(400);
    });
    // test('empty body\n\tExpect 400', () => {
    //     return request(app)
    //         .post('/api/v1/class/addCourse')
    //         .expect(400);
    // });

    // test('empty body with header\n\tExpect 400', () => {
    //     return request(app)
    //         .post('/api/v1/class/addCourse')
    //         .set('Content-Type', 'application/x-www-form-urlencoded')
    //         .expect(400);
    // });

    // test('valid body\n\tExpect 400', () => {
    //     const event = new Date('05 October 2011 14:48 UTC');
    //     return request(app)
    //         .post('/api/v1/class/addCourse')
    //         .set('Content-Type', 'application/x-www-form-urlencoded')
    //         .send({
    //             classDate: event.toISOString(),
    //             className: 'TestAddClass',
    //             classSubject: 'T',
    //             quarterID: 20174,
    //         })
    //         .expect(200);
    // });

});
