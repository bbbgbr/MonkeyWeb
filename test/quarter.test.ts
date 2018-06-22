import { config } from 'dotenv';
import { join } from 'path';
process.env = config({ path: join(__dirname, '../test.env') }).parsed;
import * as request from 'supertest';
import app from '../src/controllers/Controller';

describe('POST /api/v1/quarter/list', () => {
    test('valid request\n\tExpect 200', () => {
        return request(app)
        .post('/api/v1/quarter/list')
        .expect(200)
        .expect((res) => {
            expect(res.body).toHaveProperty('quarters');
        });
    });
});
