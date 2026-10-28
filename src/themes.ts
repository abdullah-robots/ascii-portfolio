export const THEMES = {
  // The original phosphor void: black holes on a night sky.
  void: { background: '#111210', rgb: [215, 255, 139] },
  // Ivory and antique gold: radiant stars on a sunlit sky.
  starlight: { background: '#f5efe2', rgb: [158, 114, 38] },
} as const;

export type Theme = keyof typeof THEMES;

const STORAGE_KEY = 'theme';

export function storedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'starlight' ? 'starlight' : 'void';
  } catch {
    return 'void';
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
}
