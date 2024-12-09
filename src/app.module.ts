import { Module } from '@nestjs/common';
import { UserModule } from './modules/user.module';
import { AuthModule } from './modules/auth.module';
import { DocumentModule } from './modules/document.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [AuthModule, UserModule, DocumentModule, GeminiModule]
})
export class AppModule {}
