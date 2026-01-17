const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const AAD_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  aad?: string;
  version: string;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    [    'deriveBits', 'deriveKey']
  );

  const saltBuffer = new Uint8Array(salt).buffer;
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

export async function encrypt(
  plaintext: string,
  password: string,
  salt?: Uint8Array,
  iv?: Uint8Array
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const usedSalt = salt || generateSalt();
  const usedIV = iv || generateIV();
  const aad = crypto.getRandomValues(new Uint8Array(AAD_LENGTH));
  const key = await deriveKey(password, usedSalt);
  const ivBuffer = new Uint8Array(usedIV).buffer;
  const aadBuffer = new Uint8Array(aad).buffer;
  const saltBuffer = new Uint8Array(usedSalt).buffer;
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as ArrayBuffer,
      additionalData: aadBuffer as ArrayBuffer,
      tagLength: 128,
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(ivBuffer as ArrayBuffer),
    salt: arrayBufferToBase64(saltBuffer as ArrayBuffer),
    aad: arrayBufferToBase64(aadBuffer as ArrayBuffer),
    iterations: PBKDF2_ITERATIONS,
    version: '2.0',
  };
}

export async function decrypt(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const ciphertextArray = base64ToArrayBuffer(encryptedData.ciphertext);
  const ciphertext = new Uint8Array(ciphertextArray).buffer as ArrayBuffer;
  const aad = encryptedData.aad 
    ? base64ToArrayBuffer(encryptedData.aad)
    : new Uint8Array(0);
  const key = await deriveKey(password, salt, encryptedData.iterations || PBKDF2_ITERATIONS);

  try {
    const ivBuffer = new Uint8Array(iv).buffer;
    const decryptOptions: any = {
      name: 'AES-GCM',
      iv: ivBuffer as ArrayBuffer,
      tagLength: 128,
    };
    
    if (aad.length > 0) {
      const aadBuffer = new Uint8Array(aad).buffer;
      decryptOptions.additionalData = aadBuffer as ArrayBuffer;
    }
    
    const decrypted = await crypto.subtle.decrypt(
      decryptOptions,
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar?: boolean;
  excludeAmbiguous?: boolean;
  customCharset?: string;
}

export function generatePassword(options: PasswordOptions): string {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar = false,
    excludeAmbiguous = false,
    customCharset = '',
  } = options;

  let charset = '';
  
  if (includeLowercase) {
    let lowercase = 'abcdefghijklmnopqrstuvwxyz';
    if (excludeSimilar) {
      lowercase = lowercase.replace(/[ilo]/g, '');
    }
    charset += lowercase;
  }
  
  if (includeUppercase) {
    let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (excludeSimilar) {
      uppercase = uppercase.replace(/[ILO]/g, '');
    }
    charset += uppercase;
  }
  
  if (includeNumbers) {
    let numbers = '0123456789';
    if (excludeSimilar) {
      numbers = numbers.replace(/[01]/g, '');
    }
    charset += numbers;
  }
  
  if (includeSymbols) {
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (excludeAmbiguous) {
      symbols = symbols.replace(/[{}[\]()/\\'"`~,;:.<>]/g, '');
    }
    charset += symbols;
  }
  
  if (customCharset) {
    charset += customCharset;
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  charset = Array.from(new Set(charset.split(''))).join('');

  const array = new Uint8Array(length);
  crypto.getRandomValues(array as Uint8Array);

  return Array.from(array, (x) => charset[x % charset.length]).join('');
}

export function calculatePasswordStrength(password: string): number {
  let score = 0;

  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 18) return 100;

  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  const uniqueChars = new Set(password).size;
  if (uniqueChars / password.length > 0.7) score += 10;

  return Math.min(100, score);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
