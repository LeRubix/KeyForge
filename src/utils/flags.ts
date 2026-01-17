const languageToCountryCode: Record<string, string> = {
  'en': 'GB',
  'es': 'ES',
  'de': 'DE',
  'ja': 'JP',
  'fr': 'FR',
  'pt': 'PT',
  'uk': 'UA',
  'pl': 'PL',
  'zh': 'CN',
};

const flagCache: Map<string, string> = new Map();

export function getCountryCodeForLanguage(languageCode: string): string {
  return languageToCountryCode[languageCode] || 'GB';
}

export function getFlagUrl(languageCode: string, size: number = 64): string {
  const countryCode = getCountryCodeForLanguage(languageCode);
  const cacheKey = `${countryCode}-${size}`;
  
  if (flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey)!;
  }
  
  const url = `https://flagsapi.com/${countryCode}/flat/${size}.png`;
  flagCache.set(cacheKey, url);
  return url;
}

export function preloadFlags(size: number = 64): void {
  const languageCodes = Object.keys(languageToCountryCode);
  languageCodes.forEach(langCode => {
    const url = getFlagUrl(langCode, size);
    const img = new Image();
    img.src = url;
  });
}
