import { Injectable } from '@nestjs/common';
import { CreatePromptDto } from './dto/prompt.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  async generateResponse(createPromptDto: CreatePromptDto): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(createPromptDto.text);
    const content = result.response.text();
    return content;
  }
}