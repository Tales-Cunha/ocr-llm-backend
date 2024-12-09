import { Body, Controller, Post } from '@nestjs/common';
import { CreatePromptDto } from './dto/prompt.dto';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate')
  generate(@Body() createPromptDto: CreatePromptDto): Promise<string> {
    return this.geminiService.generateResponse(createPromptDto);
  }
}