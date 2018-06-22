import { config } from 'dotenv';
import { join } from 'path';
process.env = config({ path: join(__dirname, '../test.env') }).parsed;
import * as request from 'supertest';
import app from '../src/controllers/Controller';

describe('POST /api/v1/room/list', () => {
    test('empty body\n\tExpect 200', () => {
        return request(app)
            .post('/api/v1/room/list')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('rooms');
            });
    });

    test('body with valid quarterID\n\tExpect 200', () => {
        return request(app)
            .post('/api/v1/room/list')
            .send({ quarterID: 20174 })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('rooms');
            });
    });

    test('body with invalid quarterID\n\tExpect 200', () => {
        return request(app)
            .post('/api/v1/room/list')
            .send({ quarterID: 12324 })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('rooms');
            });
    });

    test('body with undefined quarterID\n\tExpect 200', () => {
        return request(app)
            .post('/api/v1/room/list')
            .send({ quarterID: undefined })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('rooms');
            });
    });

    test('body with null quarterID\n\tExpect 200', () => {
        return request(app)
            .post('/api/v1/room/list')
            .send({ quarterID: null })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('rooms');
            });
    });
});
