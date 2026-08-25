import 'dotenv/config';
import { createHmac } from 'node:crypto';
import { compare, hash } from 'bcryptjs';

export async function hash_password(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verify_password_hashed(
  storedHash: string,
  password: string,
): Promise<boolean> {
  return compare(password, storedHash);
}

export function signJwt(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_SECRET!;
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
  const signature = createHmac('sha256', secret).update(data).digest('base64url');

  return `${data}.${signature}`;
}

export function verifyJwt(token: string): Record<string, unknown> {
  const secret = process.env.JWT_SECRET!;
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('INVALID_TOKEN');
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');

  if (signature !== expectedSignature) {
    throw new Error('INVALID_TOKEN');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as Record<
    string,
    unknown
  >;

  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('TOKEN_EXPIRED');
  }

  return payload;
}

function base64UrlEncode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
