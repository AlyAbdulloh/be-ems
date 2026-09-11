import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private emsDb: EmsPrismaService) { }

  get userModel() {
    return this.emsDb.user;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.userModel.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || '',
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User created successfully',
      data: user,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.userModel.count(),
      this.userModel.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Users fetched successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      message: 'User fetched successfully',
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { email, password, name } = updateUserDto;

    await this.findOne(id);

    if (email) {
      const existingUser = await this.userModel.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });
      if (existingUser) {
        throw new ConflictException('Email address is already in use');
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await this.userModel.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.userModel.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
    };
  }
}

