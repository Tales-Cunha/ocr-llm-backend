import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(userData: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email já está em uso.');
      }
      throw error;
    }
  }

  async login(credentials: { email: string; password: string }): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const passwordValid = await bcrypt.compare(credentials.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { token };
  }
}