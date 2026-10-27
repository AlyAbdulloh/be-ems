import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import type { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate user and generate JWT token" })
  @ApiResponse({ status: 200, description: "Successfully authenticated" })
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    response.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getMe(currentUser.sub);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out user and clear authentication cookie" })
  @ApiResponse({ status: 200, description: "Successfully logged out" })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("access_token", {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/",
    });
    return {
      message: "Logged out successfully",
    };
  }
}
