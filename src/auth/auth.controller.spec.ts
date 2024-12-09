import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  beforeEach(async () => {
    // Limpar tabelas dependentes antes de limpar a tabela User
    await prisma.lLMInteraction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.lLMInteraction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('Deve registrar um novo usuário', async () => {
      const uniqueEmail = `teste_${Date.now()}@example.com`; // Gera um email único

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: uniqueEmail,
          password: 'senha123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(uniqueEmail);
    });

    it('Deve retornar conflito ao tentar registrar com email duplicado', async () => {
      const uniqueEmail = `teste_${Date.now()}@example.com`; // Gera um email único

      // Primeiro registro deve passar
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: uniqueEmail,
          password: 'senha123',
        });

      // Segundo registro com o mesmo email deve retornar conflito
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: uniqueEmail,
          password: 'senha123',
        });

      expect(response.status).toBe(409);
    });

    it('Deve retornar erro ao registrar com dados inválidos', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: 'email-invalido',
          password: 'senha123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('Deve logar o usuário com credenciais corretas', async () => {
      const uniqueEmail = `login_${Date.now()}@example.com`; // Gera um email único

      // Registrar o usuário primeiro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: uniqueEmail,
          password: 'senha123',
        });

      // Tentar logar
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'senha123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('Deve retornar não autorizado ao tentar logar com senha incorreta', async () => {
      const uniqueEmail = `login_errado_${Date.now()}@example.com`; // Gera um email único

      // Registrar o usuário primeiro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste',
          email: uniqueEmail,
          password: 'senha123',
        });

      // Tentar logar com senha errada
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'senhaErrada',
        });

      expect(response.status).toBe(401);
    });

    it('Deve retornar não autorizado ao tentar logar com email não registrado', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'naoexiste@example.com',
          password: 'senha123',
        });

      expect(response.status).toBe(401);
    });

    it('Deve retornar erro ao logar com dados inválidos', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'email-invalido',
          password: 'senha123',
        });

      expect(response.status).toBe(400);
    });
  });
});