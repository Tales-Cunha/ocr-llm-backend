import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { User } from '@prisma/client';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() userData: User) {
        return this.authService.register(userData);
    }

    @Post('login')
    async login(@Body() credentials: { email: string; password: string }) {
        return this.authService.login(credentials);
    }
}