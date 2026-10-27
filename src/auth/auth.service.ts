import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { EmsPrismaService } from "../prisma/ems-prisma.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private emsDb: EmsPrismaService,
    private jwtService: JwtService,
  ) {}

  get userModel() {
    return this.emsDb.user;
  }

  get organizerModel() {
    return this.emsDb.organizer;
  }

  async register(registerDto: RegisterDto) {
    const { password, name } = registerDto;
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userModel.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("Email address is already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name?.trim() || "",
      },
    });

    return {
      message: "User registered successfully",
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    const user = await this.userModel.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        organizer: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account has been deactivated");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const dbRoles = user.roles.map((r) => r.role.name);
    const roles: string[] = [];
    if (dbRoles.includes("ADMIN")) {
      roles.push("ADMIN");
    } else {
      roles.push("USER");
    }
    if (user.organizer?.status === "APPROVED") {
      roles.push("ORGANIZER");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      isOrganizer: !!user.organizer,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: "Logged in successfully",
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        roles,
        organizer: user.organizer,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        organizer: {
          select: {
            id: true,
            organizationName: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    const dbRoles = user.roles ? user.roles.map((r) => r.role.name) : [];
    const formattedRoles: string[] = [];
    if (dbRoles.includes("ADMIN")) {
      formattedRoles.push("ADMIN");
    } else {
      formattedRoles.push("USER");
    }
    if (user.organizer?.status === "APPROVED") {
      formattedRoles.push("ORGANIZER");
    }

    const userWithoutRawRoles: Partial<typeof user> = { ...user };
    delete userWithoutRawRoles.roles;

    return {
      message: "Current user profile fetched successfully",
      data: {
        ...userWithoutRawRoles,
        roles: formattedRoles,
      },
    };
  }
}
