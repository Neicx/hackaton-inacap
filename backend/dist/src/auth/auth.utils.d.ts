import 'dotenv/config';
export declare function hash_password(password: string): Promise<string>;
export declare function verify_password_hashed(storedHash: string, password: string): Promise<boolean>;
export declare function signJwt(payload: Record<string, unknown>): string;
export declare function verifyJwt(token: string): Record<string, unknown>;
