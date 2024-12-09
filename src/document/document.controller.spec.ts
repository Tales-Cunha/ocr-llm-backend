// src/document/document.controller.spec.ts
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

describe('DocumentController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let jwtToken: string;
  let userId: string;

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
    // Limpar tabelas
    await prisma.lLMInteraction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  
    // Criar usuário e gerar token JWT
    const uniqueEmail = `teste_user_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        name: 'Teste',
        email: uniqueEmail,
        password: await bcrypt.hash('senha123', 10),
      },
    });
  
    userId = user.id; // Definindo o userId
    jwtToken = jwtService.sign({ sub: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.lLMInteraction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /documents/upload', () => {
    it('Deve fazer upload de um documento válido (PDF)', async () => {
      const filePath = path.join(__dirname, 'test-files', 'sample.pdf');
      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${jwtToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('sample.pdf');
    });

    it('Deve retornar bad request ao tentar upload sem arquivo', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
    });

    it('Deve retornar bad request ao tentar upload de um arquivo com formato não suportado', async () => {
        const filePath = path.join(__dirname, 'test-files', 'sample.txt');
        const response = await request(app.getHttpServer())
          .post('/documents/upload')
          .set('Authorization', `Bearer ${jwtToken}`)
          .attach('file', filePath);
      
        expect(response.status).toBe(400); // Certifique-se de que o status esperado é 400
      });
  });

  describe('GET /documents', () => {
    it('Deve recuperar lista de documentos do usuário', async () => {
      await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('Usuário sem documentos deve receber uma lista vazia', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('Deve retornar não autorizado ao tentar acessar sem token', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /documents/:id', () => {
    it('Deve recuperar documento existente do usuário', async () => {
      const document = await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${document.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('sample.pdf');
    });

    it('Deve retornar não encontrado ao tentar acessar um documento que não existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents/nonexistent-id')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
    });

    it('Deve retornar proibido ao tentar acessar documento de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `outro_${uuidv4()}@example.com`,
          password: await bcrypt.hash('senha123', 10),
        },
      });

      const document = await prisma.document.create({
        data: {
          userId: otherUser.id,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${document.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /documents/:id/download-full', () => {
    it('Deve baixar documento com texto extraído e interações', async () => {
        const document = await prisma.document.create({
          data: {
            userId: userId,
            filename: 'sample.pdf',
            fileData: Buffer.alloc(0),
            ocrText: 'Texto extraído',
            status: 'COMPLETED',
          },
        });
        
        await prisma.lLMInteraction.create({
            data: {
              documentId: document.id,
              question: 'Qual é o conteúdo do documento?',
              answer: 'Este é um documento de teste.',
            },
        });

        const response = await request(app.getHttpServer())
          .get(`/documents/${document.id}/download-full`)
          .set('Authorization', `Bearer ${jwtToken}`);
  
        expect(response.status).toBe(200);
        expect(response.header['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.header['content-disposition']).toContain('attachment; filename="sample.pdf-full.txt"');
        expect(response.text).toContain('Texto extraído');
        expect(response.text).toContain('Qual é o conteúdo do documento?');
    });

    it('Deve retornar não encontrado ao tentar baixar documento que não existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents/nonexistent-id/download-full')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
    });

    it('Deve retornar proibido ao tentar baixar documento de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `outro_download_${uuidv4()}@example.com`,
          password: await bcrypt.hash('senha123', 10),
        },
      });

      const document = await prisma.document.create({
        data: {
          userId: otherUser.id,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          ocrText: 'Texto extraído',
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${document.id}/download-full`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /documents/:id/query', () => {
    it('Deve realizar uma consulta no documento', async () => {
      const document = await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          ocrText: 'Texto extraído para consulta',
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/documents/${document.id}/query`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ question: 'Qual é o texto extraído?' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.question).toBe('Qual é o texto extraído?');
      expect(response.body.answer).toBeDefined();
    });

    it('Deve retornar bad request se o texto não foi extraído', async () => {
      const document = await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          ocrText: null,
          status: 'PENDING',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/documents/${document.id}/query`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ question: 'Qual é o texto extraído?' });

      expect(response.status).toBe(400);
    });

    it('Deve retornar proibido ao tentar consultar documento de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `outro_query_${uuidv4()}@example.com`,
          password: await bcrypt.hash('senha123', 10),
        },
      });

      const document = await prisma.document.create({
        data: {
          userId: otherUser.id,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          ocrText: 'Texto extraído',
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/documents/${document.id}/query`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ question: 'Qual é o texto extraído?' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /documents/:id/status', () => {
    it('Deve retornar o status do documento', async () => {
      const document = await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${document.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'COMPLETED');
    });

    it('Deve retornar não encontrado se o documento não existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents/nonexistent-id/status')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
    });

    it('Deve retornar proibido ao tentar acessar status de documento de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `outro_status_${uuidv4()}@example.com`,
          password: await bcrypt.hash('senha123', 10),
        },
      });

      const document = await prisma.document.create({
        data: {
          userId: otherUser.id,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${document.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('Deve excluir documento existente do usuário', async () => {
      const document = await prisma.document.create({
        data: {
          userId: userId,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/documents/${document.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
    });

    it('Deve retornar não encontrado ao tentar excluir um documento que não existe', async () => {
      const response = await request(app.getHttpServer())
        .delete('/documents/nonexistent-id')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
    });

    it('Deve retornar proibido ao tentar excluir documento de outro usuário', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `outro_delete_${uuidv4()}@example.com`,
          password: await bcrypt.hash('senha123', 10),
        },
      });

      const document = await prisma.document.create({
        data: {
          userId: otherUser.id,
          filename: 'sample.pdf',
          fileData: Buffer.from(''),
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/documents/${document.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(403);
    });
  });
});