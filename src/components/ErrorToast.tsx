import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'error' | 'success';
}

export function ErrorToast({ message, onClose, duration = 5000, type = 'error' }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <div 
        className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex-1 text-sm">{message}</div>
        <button
          onClick={onClose}
          className="flex-shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
