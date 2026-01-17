export interface BrowserPassword {
  name: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  entries: BrowserPassword[];
}

import { sanitizeImportField, validateUrl } from './security';

export function parseCSV(csvContent: string): BrowserPassword[] {
  const MAX_CSV_SIZE = 10 * 1024 * 1024;
  if (csvContent.length > MAX_CSV_SIZE) {
    throw new Error('CSV file is too large. Maximum size is 10MB.');
  }

  let normalizedContent = csvContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = normalizedContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return [];

  const MAX_LINES = 100000;
  if (lines.length > MAX_LINES) {
    throw new Error('CSV file contains too many entries. Maximum is 100,000 entries.');
  }

  const firstLineFields = parseCSVLine(lines[0]);
  let headers: string[] = [];
  let startIndex = 0;

  const normalizedHeaders = firstLineFields.map(h => h.trim().toLowerCase());
  
  const hasUrl = normalizedHeaders.some(h => h.includes('url') || h.includes('website'));
  const hasUsername = normalizedHeaders.some(h => h.includes('username') || h.includes('user') || h.includes('login'));
  const hasPassword = normalizedHeaders.some(h => h.includes('password') || h.includes('pass'));
  const hasName = normalizedHeaders.some(h => h.includes('name') || h.includes('title'));

  if (hasUrl && (hasUsername || hasPassword)) {
    headers = normalizedHeaders;
    startIndex = 1;
  } else if (hasName && hasUrl) {
    headers = normalizedHeaders;
    startIndex = 1;
  } else if (firstLineFields.length >= 3 && (hasUrl || hasUsername || hasPassword)) {
    headers = normalizedHeaders;
    startIndex = 1;
  } else {
    headers = ['name', 'url', 'username', 'password'];
    startIndex = 0;
  }

  const entries: BrowserPassword[] = [];
  let skippedCount = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 2) {
      skippedCount++;
      continue;
    }

    try {
      const entry: BrowserPassword = {
        name: '',
        url: '',
        username: '',
        password: '',
      };

      const urlIndex = headers.findIndex(h => h && (h.includes('url') || h.includes('website')));
      const usernameIndex = headers.findIndex(h => h && (h.includes('username') || h.includes('login') || (h.includes('user') && !h.includes('url'))));
      const passwordIndex = headers.findIndex(h => h && (h.includes('password') || h.includes('pass')));
      const nameIndex = headers.findIndex(h => h && (h.includes('name') || h.includes('title')));

      for (let index = 0; index < Math.min(headers.length, fields.length); index++) {
        const header = headers[index];
        if (!header) continue;
        
        const rawValue = fields[index]?.trim() || '';
        const value = sanitizeImportField(rawValue, 1000);
        
        if (index === urlIndex && urlIndex >= 0) {
          if (value) {
            const validatedUrl = validateUrl(value);
            entry.url = validatedUrl || value;
            if (!entry.name) {
              try {
                const urlToTry = value.startsWith('http') ? value : `https://${value}`;
                const urlObj = new URL(urlToTry);
                entry.name = urlObj.hostname.replace('www.', '');
              } catch (_) {
                entry.name = value.split('/')[0].split('?')[0];
              }
            }
          }
        } else if (index === usernameIndex && usernameIndex >= 0) {
          entry.username = value;
        } else if (index === passwordIndex && passwordIndex >= 0) {
          entry.password = value;
        } else if (index === nameIndex && nameIndex >= 0) {
          if (value) entry.name = value;
        } else {
          if (header.includes('name') || header.includes('title')) {
            if (value && !entry.name) entry.name = value;
          } else if (header.includes('url') || header.includes('website')) {
            if (value && !entry.url) {
              const validatedUrl = validateUrl(value);
              entry.url = validatedUrl || value;
            }
          } else if (header.includes('username') || header.includes('login') || header.includes('user')) {
            if (!entry.username) entry.username = value;
          } else if (header.includes('password') || header.includes('pass')) {
            if (!entry.password) entry.password = value;
          } else if (header.includes('note') || header.includes('comment') || header.includes('description')) {
            entry.notes = value;
          }
        }
      }

      if (!entry.name) {
        if (entry.url) {
          try {
            const urlObj = new URL(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`);
            entry.name = urlObj.hostname.replace('www.', '');
          } catch (_) {
            entry.name = entry.url;
          }
        } else {
          entry.name = entry.username || 'Imported Entry';
        }
      }

      if (entry.password) {
        if (!entry.username) {
          entry.username = '';
        }
        entries.push(entry);
      } else {
        skippedCount++;
        if (entries.length === 0 && skippedCount <= 3) {
          console.log('Skipped entry (no password):', {
            line: i + 1,
            hasUrl: !!entry.url,
            hasUsername: !!entry.username,
            hasPassword: !!entry.password,
            url: entry.url?.substring(0, 50),
            username: entry.username?.substring(0, 20),
          });
        }
      }
    } catch (error) {
      console.error('Error parsing CSV line', i + 1, error);
      skippedCount++;
    }
  }

  if (entries.length === 0) {
    const firstDataLine = lines[startIndex];
    const firstDataFields = firstDataLine ? parseCSVLine(firstDataLine) : [];
    console.log('CSV Parse Debug - No entries found:', {
      totalLines: lines.length,
      headers,
      headerCount: headers.length,
      startIndex,
      skippedCount,
      firstLine: lines[0]?.substring(0, 200),
      firstDataLine: firstDataLine?.substring(0, 200),
      firstDataFields: firstDataFields.slice(0, 5),
      headerMapping: {
        urlIndex: headers.findIndex(h => h.includes('url')),
        usernameIndex: headers.findIndex(h => h.includes('username') || h.includes('user')),
        passwordIndex: headers.findIndex(h => h.includes('password') || h.includes('pass')),
      },
    });
  }

  return entries;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  
  return fields;
}

export async function importFromFile(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    entries: [],
  };

  try {
    const text = await file.text();
    if (file.name.endsWith('.csv') || text.includes(',')) {
      const entries = parseCSV(text);
      result.entries = entries;
      result.imported = entries.length;
      result.success = entries.length > 0;
      
      if (entries.length === 0) {
        result.errors.push('No valid password entries found in file. Make sure the CSV contains url, username, and password columns.');
      }
    } else {
      result.errors.push('Unsupported file format. Please export as CSV.');
      result.success = false;
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Failed to read file');
    result.success = false;
  }

  return result;
}

export function validateImportedEntry(entry: BrowserPassword): boolean {
  return !!(entry.username && entry.password && entry.name);
}

export function normalizeImportedEntries(entries: BrowserPassword[]): BrowserPassword[] {
  return entries
    .filter(validateImportedEntry)
    .map(entry => ({
      ...entry,
      name: entry.name.trim(),
      url: entry.url?.trim() || '',
      username: entry.username.trim(),
      password: entry.password.trim(),
      notes: entry.notes?.trim() || '',
    }))
    .filter((entry, index, self) => 
      index === self.findIndex(e => 
        e.username === entry.username && 
        e.url === entry.url
      )
    );
}
