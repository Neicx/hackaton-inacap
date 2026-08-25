import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        name: string;
        email: string;
        id: string;
        created_at: Date;
        updated_at: Date;
    }>;
    findAll(): import("../../generated/prisma/internal/prismaNamespace").PrismaPromise<{
        name: string;
        email: string;
        id: string;
        created_at: Date;
        updated_at: Date;
    }[]>;
    findOne(id: string): import("../../generated/prisma/models").Prisma__UserClient<{
        name: string;
        email: string;
        id: string;
        created_at: Date;
        updated_at: Date;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    update(id: string, dto: UpdateUserDto): import("../../generated/prisma/models").Prisma__UserClient<{
        name: string;
        email: string;
        id: string;
        created_at: Date;
        updated_at: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    remove(id: string): import("../../generated/prisma/models").Prisma__UserClient<{
        name: string;
        email: string;
        id: string;
        created_at: Date;
        updated_at: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    login(dto: LoginDto): Promise<{
        jwt_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
}
