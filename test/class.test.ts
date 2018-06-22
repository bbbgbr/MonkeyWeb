import { config } from 'dotenv';
import { join } from 'path';
process.env = config({ path: join(__dirname, '../test.env') }).parsed;
import * as request from 'supertest';
import app from '../src/controllers/Controller';

describe('POST /api/v1/class/addCourse', () => {

    test('empty body\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/addCourse')
            .expect(400);
    });

    test('empty body with header\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/addCourse')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .expect(400);
    });

    test('valid body\n\tExpect 400', () => {
        const event = new Date('05 October 2011 14:48 UTC');
        return request(app)
            .post('/api/v1/class/addCourse')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
                classDate: event.toISOString(),
                className: 'TestAddClass',
                classSubject: 'T',
                quarterID: 20174,
            })
            .expect(200);
    });

});

describe('POST /api/v1/class/info', () => {

    test('invalid body\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/info')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .expect(400);
    });

    test('valid body\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/info')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
                classID: 2456,
            })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('info');
                expect(res.body).toHaveProperty('students');
            });
    });

});

describe('POST /api/v1/class/register', () => {

    test('invalid body with no header\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/register')
            .expect(400);
    });

    test('invalid body with header\n\tExpect 400', () => {
        return request(app)
            .post('/api/v1/class/register')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .expect(400);
    });

    test('send studentID and classID\n\tExpecte 200', () => {
        return request(app)
            .post('/api/v1/class/register')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
                classID: 2258,
                studentID: 15999,
            })
            .expect(200);
    });

    test('send array of studentID and classID', () => {
        return request(app)
            .post('/api/v1/class/register')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
                classesID: [
                    2258,
                    2258,
                    2258,
                ],
                studentID: 15999,
            })
            .expect(200);
    });
});
