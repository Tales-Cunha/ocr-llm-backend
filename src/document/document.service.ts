import { Injectable, NotFoundException, ForbiddenException, StreamableFile, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { Document, LLMInteraction, Prisma} from "@prisma/client";
import * as Tesseract from "tesseract.js";
import { GeminiService } from '../gemini/gemini.service';
import * as pdfParse from 'pdf-parse';
import * as natural from 'natural';

type DocumentWithInteractions = Prisma.DocumentGetPayload<{
  include: { llmInteractions: true };
}>;

@Injectable()
export class DocumentService {

    constructor(private prisma: PrismaService, private geminiService: GeminiService) {}

    async uploadDocument(userId: string, file: Express.Multer.File): Promise<Document> {
      if (!file || !file.buffer) {
        throw new BadRequestException('Falha no upload do arquivo.');
      }
    
      const supportedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!supportedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Formato de arquivo não suportado.');
      }
    
      const document = await this.prisma.document.create({
        data: {
          userId,
          filename: file.originalname,
          fileData: file.buffer,
          status: 'PENDING',
        },
      });
    
      await this.processOCR(document.id, file.buffer, file.mimetype);
      return document;
    }
  
    private async processOCR(documentId: string, fileBuffer: Buffer, mimeType: string) {
      try {
        let text = '';
        console.log('MIME TYPE:', mimeType);
        if (mimeType === 'application/pdf') {
          const data = await pdfParse(fileBuffer);
          text = data.text;
        } else if (mimeType.startsWith('image/')) {
          const result = await Tesseract.recognize(fileBuffer, 'eng');
          text = result.data.text;
        } else {
          throw new Error('Formato de arquivo não suportado.');
        }
    
        if (!text) {
          throw new Error('Texto extraído está vazio.');
        }
    
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            ocrText: text,
            status: 'COMPLETED',
          },
        });
    
      } catch (error) {
        console.error(`Erro ao processar OCR para o documento ${documentId}:`, error);
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'FAILED',
          },
        });
      }
    }

    async getUserDocuments(userId: string): Promise<Document[]> {
      return this.prisma.document.findMany({
        where: { userId },
        include: { llmInteractions: true },
      });
    }

    async getDocumentById(userId: string, documentId: string): Promise<Document> {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { llmInteractions: true },
      });
      if (!document) {
        throw new NotFoundException('Documento não encontrado.');
      }
      if (document.userId !== userId) {
        throw new ForbiddenException('Acesso negado.');
      }
      return document;
    }

    async getDocumentWithInteractions(userId: string, documentId: string): Promise<DocumentWithInteractions> {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { llmInteractions: true },
      });
  
      if (!document) {
        throw new NotFoundException('Documento não encontrado.');
      }
      if (document.userId !== userId) {
        throw new ForbiddenException('Acesso negado.');
      }
      return document;
    }
  
    async queryDocument(userId: string, documentId: string, question: string): Promise<LLMInteraction> {
      const document = await this.getDocumentById(userId, documentId);
  
      if (!document.ocrText) {
        throw new BadRequestException('O texto do documento ainda não foi extraído.');
      }
  
      const prompt = `Texto do documento: ${document.ocrText}\nPergunta: ${question}\nResposta:`;
  
      const answer = await this.geminiService.generateResponse({ text: prompt });
  
      return this.prisma.lLMInteraction.create({
        data: {
          documentId,
          question,
          answer,
        },
      });
    }
  
    async getDocumentStatus(userId: string, documentId: string): Promise<{ status: string }> {
      const document = await this.getDocumentById(userId, documentId);
      return { status: document.status };
    }

    async deleteDocument(userId: string, documentId: string): Promise<void> {
      const document = await this.getDocumentById(userId, documentId);
      if (document.userId !== userId) {
        throw new ForbiddenException('Acesso negado.');
      }
      await this.prisma.document.delete({ where: { id: document.id } });
    }
  }
