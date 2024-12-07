import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '@prisma/client';


@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async create(@Body() data: User) {
        return this.userService.create(data);
    }

    @Get()
    async findUser(@Body() data: User) {
        return this.userService.findByEmail(data.email);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.userService.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found.');
        }
        return user;
    }

}