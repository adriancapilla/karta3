export const appearanceThemes = ['LIGHT', 'DARK', 'CREAM', 'HIGH_CONTRAST'] as const;
export type AppearanceTheme = typeof appearanceThemes[number];
export type AppearanceValue = { theme: AppearanceTheme; origin: 'DEFAULT' | 'EXPLICIT' };
export function appearanceValue(value: unknown): value is AppearanceValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 2 && appearanceThemes.includes(v.theme as AppearanceTheme)
    && (v.origin === 'EXPLICIT' || v.origin === 'DEFAULT' && v.theme === 'LIGHT');
}
