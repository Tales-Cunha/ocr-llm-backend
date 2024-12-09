import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let jwtToken: string;
  let userEmail: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secretKey'; // Defina o segredo JWT

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

    // Gerar email único
    userEmail = `teste_user_${Date.now()}@example.com`;

    // Criar um usuário de teste e gerar um token JWT
    const user = await prisma.user.create({
      data: {
        name: 'Teste',
        email: userEmail,
        password: await bcrypt.hash('senha123', 10),
      },
    });
    jwtToken = jwtService.sign({ sub: user.id, email: user.email }); // Atualizado aqui
  });

  afterAll(async () => {
    await prisma.lLMInteraction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('GET /users/me', () => {
    it('Deve recuperar o perfil com um token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userEmail);
    });

    it('Deve retornar não autorizado ao tentar acessar com token inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer tokenInvalido');

      expect(response.status).toBe(401);
    });

    it('Deve retornar não autorizado ao tentar acessar sem token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me');

      expect(response.status).toBe(401);
    });
  });
});