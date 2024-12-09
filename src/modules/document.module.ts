import { Module } from '@nestjs/common';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, GeminiService],
})
export class DocumentModule {}