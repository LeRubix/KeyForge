import { X, Download } from 'lucide-react';
import { UpdateInfo } from '@/utils/updates';
import { t } from '@/utils/i18n';

interface UpdatePopupProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
  onDownloadInstaller: () => void;
  onDownloadPortable: () => void;
}

export function UpdatePopup({ updateInfo, onClose, onDownloadInstaller, onDownloadPortable }: UpdatePopupProps) {
  const hasInstaller = updateInfo.assets.some(a => 
    a.name.toLowerCase().includes('.exe') && 
    !a.name.toLowerCase().includes('portable')
  );
  const hasPortable = updateInfo.assets.some(a => 
    a.name.toLowerCase().includes('portable')
  );

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div 
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)' 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-gradient, var(--color-primary))' }}>
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('settings.update.available')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Version {updateInfo.version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('settings.update.description')}
        </p>

        <div className="flex gap-2">
          {hasInstaller && (
            <button
              onClick={onDownloadInstaller}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('settings.update.downloadInstaller')}
            </button>
          )}
          {hasPortable && (
            <button
              onClick={onDownloadPortable}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('settings.update.downloadPortable')}
            </button>
          )}
          {!hasInstaller && !hasPortable && (
            <button
              onClick={() => window.open(updateInfo.url, '_blank', 'noopener,noreferrer')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('settings.update.download')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
