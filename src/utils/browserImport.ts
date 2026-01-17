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

  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const MAX_LINES = 100000;
  if (lines.length > MAX_LINES) {
    throw new Error('CSV file contains too many entries. Maximum is 100,000 entries.');
  }

  const firstLine = lines[0].toLowerCase();
  let headers: string[] = [];
  let startIndex = 0;

  if (firstLine.includes('name') && firstLine.includes('url')) {
    headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    startIndex = 1;
  } else if (firstLine.includes('url') && firstLine.includes('username')) {
    headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    startIndex = 1;
  } else {
    headers = ['name', 'url', 'username', 'password'];
    startIndex = 0;
  }

  const entries: BrowserPassword[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 3) continue;

    try {
      const entry: BrowserPassword = {
        name: '',
        url: '',
        username: '',
        password: '',
      };

      for (let index = 0; index < headers.length; index++) {
        const header = headers[index];
        const rawValue = fields[index]?.trim() || '';
        
        const value = sanitizeImportField(rawValue, 1000);
        
        if (header.includes('name') || header.includes('title')) {
          entry.name = value || 'Imported Entry';
        } else if (header.includes('url') || header.includes('website')) {
          if (value) {
            const validatedUrl = validateUrl(value);
            entry.url = validatedUrl || value;
          }
          if (!entry.name && value) {
            try {
              const urlObj = new URL(value.startsWith('http') ? value : `https://${value}`);
              entry.name = urlObj.hostname.replace('www.', '');
            } catch (_) {
              entry.name = value;
            }
          }
        } else if (header.includes('username') || header.includes('login')) {
          entry.username = value;
        } else if (header.includes('password')) {
          entry.password = value;
        } else if (header.includes('note') || header.includes('comment')) {
          entry.notes = value;
        }
      }

      if (!entry.name) {
        entry.name = entry.url || entry.username || 'Imported Entry';
      }

      if (entry.username && entry.password) {
        entries.push(entry);
      }
    } catch (error) {
      console.error('Error parsing CSV line');
    }
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
      result.success = true;
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
