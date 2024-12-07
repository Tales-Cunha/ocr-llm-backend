import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, User } from '@prisma/client';



@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async create(data: Prisma.UserCreateInput): Promise<User> {
        try {
            return await this.prisma.user.create({ data });
        } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
            throw new ConflictException('This email is already taken.');
            }
        }
        throw error;
        }
    }

    async findOne(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
        where: { id },
        });
        if (!user) {
        throw new NotFoundException('User not found.');
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
        where: { email },
        });
    }
}