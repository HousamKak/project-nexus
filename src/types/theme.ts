// src/types/theme.ts

/**
 * Theme system interfaces
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: Typography;
  animations: AnimationSettings;
  effects: EffectSettings;
}

export interface ThemeColors {
  // Background colors
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Galaxy specific
  starfield: string;
  nebula: string[];
  planetGlow: string;
  orbitRing: string;
  
  // Code syntax
  syntax: SyntaxColors;
}

export interface SyntaxColors {
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  variable: string;
  class: string;
  operator: string;
}

export interface Typography {
  fontFamily: {
    primary: string;
    code: string;
    display: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: number;
    regular: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface AnimationSettings {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    standard: string;
    bounce: string;
    smooth: string;
  };
  enabled: boolean;
  reducedMotion: boolean;
}

export interface EffectSettings {
  blur: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
  particles: {
    enabled: boolean;
    density: number;
    speed: number;
  };
  gradients: {
    radial: boolean;
    linear: boolean;
  };
}

export interface UserPreferences {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  firstDayOfWeek: number;
  animations: boolean;
  soundEffects: boolean;
  autoSave: boolean;
  keyboardShortcuts: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemedComponent {
  applyTheme(theme: Theme): void;
}

export class ThemeValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'ThemeValidationError';
  }
}