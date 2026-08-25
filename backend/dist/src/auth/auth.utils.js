"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash_password = hash_password;
exports.verify_password_hashed = verify_password_hashed;
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
require("dotenv/config");
const node_crypto_1 = require("node:crypto");
const bcryptjs_1 = require("bcryptjs");
async function hash_password(password) {
    return (0, bcryptjs_1.hash)(password, 12);
}
async function verify_password_hashed(storedHash, password) {
    return (0, bcryptjs_1.compare)(password, storedHash);
}
function signJwt(payload) {
    const secret = process.env.JWT_SECRET;
    const header = { alg: 'HS256', typ: 'JWT' };
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresInSeconds = 60 * 60;
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode({
        ...payload,
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds,
    });
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = (0, node_crypto_1.createHmac)('sha256', secret).update(data).digest('base64url');
    return `${data}.${signature}`;
}
function verifyJwt(token) {
    const secret = process.env.JWT_SECRET;
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error('INVALID_TOKEN');
    }
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = (0, node_crypto_1.createHmac)('sha256', secret).update(data).digest('base64url');
    if (signature !== expectedSignature) {
        throw new Error('INVALID_TOKEN');
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error('TOKEN_EXPIRED');
    }
    return payload;
}
function base64UrlEncode(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}
//# sourceMappingURL=auth.utils.js.map