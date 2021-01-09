import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { User, ApiKey } from '@prisma/client';

const email = 'staart@anandchowdhary.com';
const password = randomBytes(10).toString();

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('gets /', () => request(app.getHttpServer()).get('/').expect(302));

  let tokens:
    | { accessToken: string; refreshToken: string }
    | undefined = undefined;
  let userId: number | undefined = undefined;
  let apiKeyStr: string | undefined = undefined;

  it('registers and logs in', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Accept', 'application/json')
      .send({ name: 'Koj Bot', email, password })
      .expect(201);
    const { id }: User = registerResponse.body;
    userId = id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ email, password })
      .expect(201);
    tokens = loginResponse.body;
  });

  it('gets user details', () =>
    request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200));

  it('creates and uses API key', async () => {
    const apiKeyResponse = await request(app.getHttpServer())
      .post(`/users/${userId}/api-keys`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ name: 'Example API key', scopes: [`user-${userId}:read-info`] })
      .expect(201);
    const { apiKey }: ApiKey = apiKeyResponse.body;
    apiKeyStr = apiKey;

    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Accept', 'application/json')
      .set('X-Api-Key', apiKeyStr)
      .expect(200);
  });

  afterAll(async () => {
    const client = new PrismaClient();
    await client.user.deleteMany({ where: { emails: { some: { email } } } });
  });
});
