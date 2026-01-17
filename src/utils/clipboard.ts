const CLIPBOARD_CLEAR_TIMEOUT = 30 * 1000;

let clipboardClearTimer: number | null = null;
let lastCopiedText: string | null = null;

export async function copyToClipboard(text: string, autoClear: boolean = true): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    
    if (autoClear) {
      lastCopiedText = text;
      
      if (clipboardClearTimer !== null) {
        clearTimeout(clipboardClearTimer);
      }
      
      clipboardClearTimer = window.setTimeout(async () => {
        try {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === lastCopiedText) {
            await navigator.clipboard.writeText('');
          }
          lastCopiedText = null;
        } catch (error) {
          console.error('Failed to clear clipboard');
        }
        clipboardClearTimer = null;
      }, CLIPBOARD_CLEAR_TIMEOUT);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export function cancelClipboardClear(): void {
  if (clipboardClearTimer !== null) {
    clearTimeout(clipboardClearTimer);
    clipboardClearTimer = null;
  }
  lastCopiedText = null;
}

export function clearSensitiveString(str: string): void {
  if (typeof str !== 'string' || str.length === 0) return;
  
  try {
    const arr = str.split('');
    for (let i = 0; i < arr.length; i++) {
      arr[i] = '\0';
    }
    arr.length = 0;
  } catch (e) {
  }
}
