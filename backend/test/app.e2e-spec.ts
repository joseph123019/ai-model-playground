import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AI Model Playground E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Clean up test data before running tests
    await prisma.response.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } });
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await prisma.response.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } });
    
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'test123456',
    };

    it('/auth/register (POST) should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      
      authToken = response.body.access_token;
      testUserId = response.body.user.id;
    });

    it('/auth/register (POST) should fail with duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('/auth/register (POST) should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'test123456',
        })
        .expect(400);
    });

    it('/auth/register (POST) should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: '123',
        })
        .expect(400);
    });

    it('/auth/login (POST) should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('/auth/login (POST) should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/auth/login (POST) should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'test123456',
        })
        .expect(401);
    });

    it('/auth/me (GET) should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.id).toBe(testUserId);
    });

    it('/auth/me (GET) should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('/auth/me (GET) should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('Database Operations', () => {
    it('should create a session in database', async () => {
      const session = await prisma.session.create({
        data: {
          prompt: 'Test prompt',
          userId: testUserId,
        },
      });

      expect(session).toHaveProperty('id');
      expect(session.prompt).toBe('Test prompt');
      expect(session.userId).toBe(testUserId);
    });

    it('should create a response in database', async () => {
      const session = await prisma.session.create({
        data: {
          prompt: 'Another test prompt',
          userId: testUserId,
        },
      });

      const response = await prisma.response.create({
        data: {
          model: 'GPT-4o',
          content: 'Test response content',
          tokens: 100,
          cost: 0.005,
          status: 'complete',
          sessionId: session.id,
        },
      });

      expect(response).toHaveProperty('id');
      expect(response.model).toBe('GPT-4o');
      expect(response.sessionId).toBe(session.id);
    });

    it('should retrieve session with responses', async () => {
      const session = await prisma.session.create({
        data: {
          prompt: 'Complex test prompt',
          userId: testUserId,
        },
      });

      await prisma.response.createMany({
        data: [
          {
            model: 'GPT-4o',
            content: 'GPT-4o response',
            tokens: 150,
            cost: 0.0075,
            status: 'complete',
            sessionId: session.id,
          },
          {
            model: 'Claude 3.5 Sonnet',
            content: 'Claude response',
            tokens: 200,
            cost: 0.01,
            status: 'complete',
            sessionId: session.id,
          },
        ],
      });

      const sessionWithResponses = await prisma.session.findUnique({
        where: { id: session.id },
        include: { responses: true },
      });

      expect(sessionWithResponses?.responses).toHaveLength(2);
      expect(sessionWithResponses?.responses[0].model).toBe('GPT-4o');
      expect(sessionWithResponses?.responses[1].model).toBe('Claude 3.5 Sonnet');
    });

    it('should find user sessions', async () => {
      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
        include: { responses: true },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].userId).toBe(testUserId);
    });
  });

  describe('User Model Validation', () => {
    it('should enforce unique email constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com',
            password: 'hashedpassword',
          },
        })
      ).rejects.toThrow();
    });

    it('should create user with activation fields', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test-activation@example.com',
          password: 'hashedpassword',
          isActive: false,
          activationToken: 'test-token-123',
          activationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      expect(user.isActive).toBe(false);
      expect(user.activationToken).toBe('test-token-123');
      expect(user.activationTokenExpires).toBeDefined();

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Session and Response Relationships', () => {
    it('should cascade delete responses when session is deleted', async () => {
      const session = await prisma.session.create({
        data: {
          prompt: 'Test cascade delete',
          userId: testUserId,
        },
      });

      await prisma.response.create({
        data: {
          model: 'GPT-4o',
          content: 'Test content',
          status: 'complete',
          sessionId: session.id,
        },
      });

      const responsesBefore = await prisma.response.findMany({
        where: { sessionId: session.id },
      });
      expect(responsesBefore).toHaveLength(1);

      await prisma.session.delete({ where: { id: session.id } });

      const responsesAfter = await prisma.response.findMany({
        where: { sessionId: session.id },
      });
      expect(responsesAfter).toHaveLength(0);
    });
  });

  describe('Cost Calculator Utility', () => {
    it('should calculate costs correctly for different models', () => {
      const { calculateCost } = require('./../src/utils/cost-calculator');

      // GPT-4o: input $0.005/1K, output $0.015/1K
      const gpt4oCost = calculateCost('gpt-4o', 1000, 1000);
      expect(gpt4oCost).toBe(0.02); // 0.005 + 0.015

      // Claude 3.5 Sonnet: input $0.003/1K, output $0.015/1K
      const claudeCost = calculateCost('claude-3-5-sonnet-20241022', 1000, 1000);
      expect(claudeCost).toBe(0.018); // 0.003 + 0.015
    });

    it('should get correct model display names', () => {
      const { getModelDisplayName } = require('./../src/utils/cost-calculator');

      expect(getModelDisplayName('gpt-4o')).toBe('GPT-4o');
      expect(getModelDisplayName('claude-3-5-sonnet-20241022')).toBe('Claude 3.5 Sonnet');
      expect(getModelDisplayName('unknown-model')).toBe('unknown-model');
    });
  });
});