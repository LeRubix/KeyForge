export function validateUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    let fullUrl: string;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      fullUrl = trimmed;
    } else {
      fullUrl = `https://${trimmed}`;
    }

    const urlObj = new URL(fullUrl);

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }

    return urlObj.href;
  } catch (error) {
    return null;
  }
}

export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeImportField(value: string, maxLength: number = 10000): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let sanitized = value.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

export function validateFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  if (filePath.includes('..') || filePath.includes('~')) {
    return false;
  }

  if (typeof window !== 'undefined' && (filePath.startsWith('/') || /^[A-Z]:\\/.test(filePath))) {
    return false;
  }

  return true;
}

const RATE_LIMIT_PREFIX = 'keyforge_rate_limit_';

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const storageKey = `${RATE_LIMIT_PREFIX}${key}`;
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, resetAt: now + windowMs }));
      return true;
    }

    const data = JSON.parse(stored);
    
    if (now > data.resetAt) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, resetAt: now + windowMs }));
      return true;
    }

    if (data.count >= maxAttempts) {
      return false;
    }

    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Rate limit check failed');
    return true;
  }
}

export function clearRateLimit(key: string): void {
  const storageKey = `${RATE_LIMIT_PREFIX}${key}`;
  localStorage.removeItem(storageKey);
}

export function getRemainingAttempts(key: string, maxAttempts: number = 5): number {
  const storageKey = `${RATE_LIMIT_PREFIX}${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return maxAttempts;
    }

    const data = JSON.parse(stored);
    const now = Date.now();
    
    if (now > data.resetAt) {
      return maxAttempts;
    }

    return Math.max(0, maxAttempts - data.count);
  } catch (error) {
    return maxAttempts;
  }
}
