import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, Body, Request, UseGuards, Res, Delete   } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentService } from "../services/document.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Document, LLMInteraction } from "@prisma/client";
import { Response } from 'express';
import * as multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

@Controller('documents')
export class DocumentController {
    constructor(private readonly documentService: DocumentService) {}

    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage }))
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ): Promise<Document> {
        const userId = req.user.userId;
        return this.documentService.uploadDocument(userId, file);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserDocuments(@Request() req): Promise<Document[]> {
        const userId = req.user.userId;
        return this.documentService.getUserDocuments(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getDocument(@Param('id') id: string, @Request() req): Promise<Document> {
        const userId = req.user.userId;
        return this.documentService.getDocumentById(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/download-full')
    async downloadDocumentWithText(
        @Param('id') id: string,
        @Request() req,
        @Res() res: Response,
    ) {
        const userId = req.user.userId;
        const documentData = await this.documentService.getDocumentWithInteractions(userId, id);

        const content = `
    Documento: ${documentData.filename}

    Texto Extraído:
    ${documentData.ocrText}

    Interações:
    ${documentData.llmInteractions
        .map(
            (interaction) => `
    Pergunta: ${interaction.question}
    Resposta: ${interaction.answer}
    `,
        )
        .join('\n')}
    `;

        res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${documentData.filename}-full.txt"`,
        });
        res.send(content);
    }


    @UseGuards(JwtAuthGuard)
    @Post(':id/query')
    async queryDocument(
        @Param('id') id: string,
        @Body('question') question: string,
        @Request() req,
    ): Promise<LLMInteraction> {
        const userId = req.user.userId;
        return this.documentService.queryDocument(userId, id, question);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/status')
    async getDocumentStatus(@Param('id') id: string, @Request() req): Promise<{ status: string }> {
        const userId = req.user.userId;
        return this.documentService.getDocumentStatus(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteDocument(@Param('id') id: string, @Request() req): Promise<void> {
        const userId = req.user.userId;
        await this.documentService.deleteDocument(userId, id);
    }
}
