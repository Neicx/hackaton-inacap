"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoAuthRequired = exports.NO_AUTH_REQUIRED_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.NO_AUTH_REQUIRED_KEY = 'noAuthRequired';
const NoAuthRequired = () => (0, common_1.SetMetadata)(exports.NO_AUTH_REQUIRED_KEY, true);
exports.NoAuthRequired = NoAuthRequired;
//# sourceMappingURL=no-auth-required.decorator.js.map