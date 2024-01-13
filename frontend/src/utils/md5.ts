// @ts-ignore
import crypto from 'crypto';

// write a md5 function
export function md5(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
}
