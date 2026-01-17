export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'navy' | 'cyan' | 'yellow' | 'pink';
export type ColorMode = 'dark' | 'light' | 'darkBlue' | 'grey';
export type BackgroundGradient = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'black';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
}

export type Theme = ColorMode | ColorScheme;

const darkThemes: Record<ColorScheme, Omit<ThemeColors, 'background' | 'surface' | 'surfaceHover' | 'border' | 'text' | 'textSecondary'>> = {
  blue: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#1e3a5f',
    accent: '#60a5fa',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  green: {
    primary: '#22c55e',
    primaryHover: '#16a34a',
    secondary: '#1e3a1e',
    accent: '#4ade80',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  purple: {
    primary: '#a855f7',
    primaryHover: '#9333ea',
    secondary: '#2a1a3a',
    accent: '#c084fc',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  orange: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#3a2a1a',
    accent: '#fb923c',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  red: {
    primary: '#ef4444',
    primaryHover: '#dc2626',
    secondary: '#3a1a1a',
    accent: '#f87171',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  teal: {
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    secondary: '#1a3a3a',
    accent: '#5eead4',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  navy: {
    primary: '#3b5f9f',
    primaryHover: '#2d4a7c',
    secondary: '#1e3a5f',
    accent: '#5b7db8',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  cyan: {
    primary: '#11998e',
    primaryHover: '#0e7a72',
    secondary: '#1a3a3a',
    accent: '#38ef7d',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  yellow: {
    primary: '#fbbf24',
    primaryHover: '#f59e0b',
    secondary: '#3a3a1a',
    accent: '#fcd34d',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  pink: {
    primary: '#f472b6',
    primaryHover: '#ec4899',
    secondary: '#3a1a2a',
    accent: '#f9a8d4',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
};

const lightThemes: Record<ColorScheme, Omit<ThemeColors, 'background' | 'surface' | 'surfaceHover' | 'border' | 'text' | 'textSecondary'>> = {
  blue: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#dbeafe',
    accent: '#60a5fa',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  green: {
    primary: '#22c55e',
    primaryHover: '#16a34a',
    secondary: '#dcfce7',
    accent: '#4ade80',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  purple: {
    primary: '#a855f7',
    primaryHover: '#9333ea',
    secondary: '#f3e8ff',
    accent: '#c084fc',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  orange: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#ffedd5',
    accent: '#fb923c',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  red: {
    primary: '#ef4444',
    primaryHover: '#dc2626',
    secondary: '#fee2e2',
    accent: '#f87171',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  teal: {
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    secondary: '#ccfbf1',
    accent: '#5eead4',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  navy: {
    primary: '#3b5f9f',
    primaryHover: '#2d4a7c',
    secondary: '#dbeafe',
    accent: '#5b7db8',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  cyan: {
    primary: '#11998e',
    primaryHover: '#0e7a72',
    secondary: '#ccfbf1',
    accent: '#38ef7d',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  yellow: {
    primary: '#fbbf24',
    primaryHover: '#f59e0b',
    secondary: '#fef3c7',
    accent: '#fcd34d',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  pink: {
    primary: '#f472b6',
    primaryHover: '#ec4899',
    secondary: '#fce7f3',
    accent: '#f9a8d4',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
};

export function getThemeColorsByMode(mode: ColorMode, scheme: ColorScheme): ThemeColors {
  const baseColors = (mode === 'dark' || mode === 'darkBlue' || mode === 'grey') ? darkThemes[scheme] : lightThemes[scheme];
  
  if (mode === 'dark') {
    return {
      background: '#000000',
      surface: '#0a0a0a',
      surfaceHover: '#1a1a1a',
      border: '#2a2a2a',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      ...baseColors,
    };
  } else if (mode === 'darkBlue') {
    return {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      border: '#475569',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      ...baseColors,
    };
  } else if (mode === 'grey') {
    return {
      background: '#1a1a1a',
      surface: '#2a2a2a',
      surfaceHover: '#3a3a3a',
      border: '#4a4a4a',
      text: '#f1f5f9',
      textSecondary: '#a1a1a1',
      ...baseColors,
    };
  } else {
    return {
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHover: '#f1f5f9',
      border: '#e2e8f0',
      text: '#0f172a',
      textSecondary: '#64748b',
      ...baseColors,
    };
  }
}

const themes: Record<string, ThemeColors> = {
  dark: getThemeColorsByMode('dark', 'blue'),
  light: getThemeColorsByMode('light', 'blue'),
  blue: getThemeColorsByMode('dark', 'blue'),
  green: getThemeColorsByMode('dark', 'green'),
  purple: getThemeColorsByMode('dark', 'purple'),
  orange: getThemeColorsByMode('dark', 'orange'),
};

export function getThemeColors(theme: Theme): ThemeColors {
  if (themes[theme]) {
    return themes[theme];
  }
  return getThemeColorsByMode('dark', 'blue');
}

export function getColorMode(): ColorMode {
  const saved = localStorage.getItem('keyforge_color_mode');
  if (saved === 'dark' || saved === 'light' || saved === 'darkBlue' || saved === 'grey') {
    return saved as ColorMode;
  }
  return 'dark';
}

export function getColorScheme(): ColorScheme {
  const saved = localStorage.getItem('keyforge_color_scheme');
  return (saved as ColorScheme) || 'cyan';
}

export function saveColorMode(mode: ColorMode): void {
  localStorage.setItem('keyforge_color_mode', mode);
}

export function saveColorScheme(scheme: ColorScheme): void {
  localStorage.setItem('keyforge_color_scheme', scheme);
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem('keyforge_theme', theme);
  if (theme === 'dark' || theme === 'light') {
    saveColorMode(theme);
  } else {
    saveColorScheme(theme as ColorScheme);
  }
}

export function loadTheme(): Theme {
  const saved = localStorage.getItem('keyforge_theme');
  return (saved as Theme) || 'dark';
}

export function applyTheme(mode?: ColorMode, scheme?: ColorScheme): void {
  const colorMode = mode || getColorMode();
  const colorScheme = scheme || getColorScheme();
  const colors = getThemeColorsByMode(colorMode, colorScheme);
  const root = document.documentElement;
  
  root.style.setProperty('--bg-primary', colors.background);
  root.style.setProperty('--bg-surface', colors.surface);
  root.style.setProperty('--bg-surface-hover', colors.surfaceHover);
  root.style.setProperty('--border-color', colors.border);
  root.style.setProperty('--text-primary', colors.text);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.primaryHover);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  
  if (colorScheme === 'cyan') {
    root.style.setProperty('--color-primary-gradient', 'linear-gradient(to right, #11998e, #38ef7d)');
    root.style.setProperty('--color-primary-gradient-hover', 'linear-gradient(to right, #0e7a72, #2dd66f)');
  } else {
    root.style.setProperty('--color-primary-gradient', colors.primary);
    root.style.setProperty('--color-primary-gradient-hover', colors.primaryHover);
  }
}

export function getBackgroundGradient(): BackgroundGradient {
  const saved = localStorage.getItem('keyforge_background_gradient');
  return (saved as BackgroundGradient) || 'default';
}

export function saveBackgroundGradient(gradient: BackgroundGradient): void {
  localStorage.setItem('keyforge_background_gradient', gradient);
}

export function getGradientColors(gradient: BackgroundGradient): { from: string; via: string; to: string } {
  switch (gradient) {
    case 'default':
      return { from: '#1e3a8a', via: '#3b82f6', to: '#1e3a8a' };
    case 'blue':
      return { from: '#1e3a8a', via: '#3b82f6', to: '#1e3a8a' };
    case 'green':
      return { from: '#065f46', via: '#10b981', to: '#065f46' };
    case 'purple':
      return { from: '#581c87', via: '#a855f7', to: '#581c87' };
    case 'orange':
      return { from: '#7c2d12', via: '#f97316', to: '#7c2d12' };
    case 'red':
      return { from: '#7f1d1d', via: '#ef4444', to: '#7f1d1d' };
    case 'teal':
      return { from: '#134e4a', via: '#14b8a6', to: '#134e4a' };
    case 'black':
    default:
      return { from: '#000000', via: '#1a1a1a', to: '#000000' };
  }
}

export function initializeTheme(): void {
  const mode = getColorMode();
  const scheme = getColorScheme();
  applyTheme(mode, scheme);
}
