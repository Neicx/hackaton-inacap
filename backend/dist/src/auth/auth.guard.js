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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_utils_1 = require("./auth.utils");
const no_auth_required_decorator_1 = require("./no-auth-required.decorator");
let AuthGuard = class AuthGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const noAuthRequired = this.reflector.getAllAndOverride(no_auth_required_decorator_1.NO_AUTH_REQUIRED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (noAuthRequired) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('MISSING_TOKEN');
        }
        const token = authorization.slice('Bearer '.length).trim();
        if (!token) {
            throw new common_1.UnauthorizedException('MISSING_TOKEN');
        }
        try {
            request.user = (0, auth_utils_1.verifyJwt)(token);
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('INVALID_TOKEN');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map