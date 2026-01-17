import { useEffect, useRef } from 'react';
import { t } from '@/utils/i18n';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onCopy,
  onCut,
  onPaste,
  canCopy,
  canCut,
  canPaste,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleCut = () => {
    onCut();
    onClose();
  };

  const handlePaste = () => {
    onPaste();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] rounded-lg shadow-2xl overflow-hidden min-w-[150px]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="py-1">
        {canCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 text-sm transition-colors"
            style={{
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {t('context.copy')}
          </button>
        )}
        {canCut && (
          <button
            type="button"
            onClick={handleCut}
            className="w-full text-left px-4 py-2 text-sm transition-colors"
            style={{
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {t('context.cut')}
          </button>
        )}
        {canPaste && (
          <button
            type="button"
            onClick={handlePaste}
            className="w-full text-left px-4 py-2 text-sm transition-colors"
            style={{
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {t('context.paste')}
          </button>
        )}
      </div>
    </div>
  );
}
