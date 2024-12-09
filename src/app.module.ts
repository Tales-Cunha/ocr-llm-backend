import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './document/document.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [AuthModule, UserModule, DocumentModule, GeminiModule]
})
export class AppModule {}
