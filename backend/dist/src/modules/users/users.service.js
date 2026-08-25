"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_utils_1 = require("../../auth/auth.utils");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const hashed_password = await (0, auth_utils_1.hash_password)(createUserDto.password);
        return this.prisma.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                hashed_password: hashed_password,
            },
            omit: {
                hashed_password: true,
            },
        });
    }
    findAll() {
        return this.prisma.user.findMany({
            omit: { hashed_password: true },
        });
    }
    findOne(id) {
        return this.prisma.user.findUnique({
            where: {
                id: id,
            },
            omit: { hashed_password: true },
        });
    }
    update(id, dto) {
        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                name: dto.name,
                email: dto.email,
            },
            omit: { hashed_password: true },
        });
    }
    remove(id) {
        return this.prisma.user.delete({
            where: {
                id,
            },
            omit: { hashed_password: true },
        });
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user || !(await (0, auth_utils_1.verify_password_hashed)(user.hashed_password, dto.password))) {
            throw new common_1.UnauthorizedException('INVALID_CREDENTIALS');
        }
        const jwt_token = (0, auth_utils_1.signJwt)({
            sub: user.id,
            email: user.email,
            name: user.name,
        });
        return {
            jwt_token: jwt_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map