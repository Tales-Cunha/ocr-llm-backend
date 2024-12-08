import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, User } from '@prisma/client';



@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
        where: { email },
        });
    }
}