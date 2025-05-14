// src/themes/base-theme.ts

// These imports are used in the function signature, so they're not actually unused
import { Theme } from '../types/theme'; // Removed unused imports

/**
 * Base theme configuration that other themes extend
 */
export const baseTheme: Theme = {
  id: 'base',
  name: 'Base Theme',
  description: 'Base theme configuration',
  
  colors: {
    // Background colors
    backgroundPrimary: '#000000',
    backgroundSecondary: '#111111',
    backgroundTertiary: '#222222',
    
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#888888',
    
    // Accent colors
    accentPrimary: '#4A90E2',
    accentSecondary: '#7AB8FF',
    
    // Status colors
    success: '#50C878',
    warning: '#FFB84D',
    error: '#E74C3C',
    info: '#3498DB',
    
    // Galaxy specific
    starfield: '#FFFFFF',
    nebula: ['#4A90E2', '#9B59B6', '#1ABC9C'],
    planetGlow: '#4A90E2',
    orbitRing: '#333333',
    
    // Code syntax
    syntax: {
      keyword: '#569CD6',
      string: '#CE9178',
      number: '#B5CEA8',
      comment: '#6A9955',
      function: '#DCDCAA',
      variable: '#9CDCFE',
      class: '#4EC9B0',
      operator: '#D4D4D4'
    }
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      code: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      display: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    fontSize: {
      xs: '0.75rem',  // 12px
      sm: '0.875rem', // 14px
      md: '1rem',     // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem',  // 20px
      xxl: '1.5rem'   // 24px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 600
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  animations: {
    duration: {
      fast: 200,
      normal: 400,
      slow: 800
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
    },
    enabled: true,
    reducedMotion: false
  },
  
  effects: {
    blur: {
      sm: '4px',
      md: '8px',
      lg: '16px'
    },
    shadow: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
      glow: '0 0 20px rgba(74, 144, 226, 0.5)'
    },
    particles: {
      enabled: true,
      density: 1,
      speed: 1
    },
    gradients: {
      radial: true,
      linear: true
    }
  }
};

/**
 * Create a theme by extending the base theme
 */
export function createTheme(
  id: string,
  name: string,
  description: string,
  overrides: DeepPartial<Theme>
): Theme {
  return deepMerge(baseTheme, {
    id,
    name,
    description,
    ...overrides
  });
}

/**
 * Deep merge utility for theme configuration
 */
function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (sourceValue === undefined) {
      continue;
    }
    
    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as any;
    }
  }
  
  return result;
}

/**
 * Deep partial type utility
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Apply theme to CSS variables
 */
export function applyThemeToCSS(theme: Theme): void {
  const root = document.documentElement;
  
  // Set color variables
  setCSSVariable(root, '--color-bg-primary', theme.colors.backgroundPrimary);
  setCSSVariable(root, '--color-bg-secondary', theme.colors.backgroundSecondary);
  setCSSVariable(root, '--color-bg-tertiary', theme.colors.backgroundTertiary);
  
  setCSSVariable(root, '--color-text-primary', theme.colors.textPrimary);
  setCSSVariable(root, '--color-text-secondary', theme.colors.textSecondary);
  setCSSVariable(root, '--color-text-tertiary', theme.colors.textTertiary);
  
  setCSSVariable(root, '--color-accent-primary', theme.colors.accentPrimary);
  setCSSVariable(root, '--color-accent-secondary', theme.colors.accentSecondary);
  
  setCSSVariable(root, '--color-success', theme.colors.success);
  setCSSVariable(root, '--color-warning', theme.colors.warning);
  setCSSVariable(root, '--color-error', theme.colors.error);
  setCSSVariable(root, '--color-info', theme.colors.info);
  
  // Set typography variables
  setCSSVariable(root, '--font-primary', theme.typography.fontFamily.primary);
  setCSSVariable(root, '--font-code', theme.typography.fontFamily.code);
  setCSSVariable(root, '--font-display', theme.typography.fontFamily.display);
  
  setCSSVariable(root, '--font-size-xs', theme.typography.fontSize.xs);
  setCSSVariable(root, '--font-size-sm', theme.typography.fontSize.sm);
  setCSSVariable(root, '--font-size-md', theme.typography.fontSize.md);
  setCSSVariable(root, '--font-size-lg', theme.typography.fontSize.lg);
  setCSSVariable(root, '--font-size-xl', theme.typography.fontSize.xl);
  setCSSVariable(root, '--font-size-xxl', theme.typography.fontSize.xxl);
  
  setCSSVariable(root, '--font-weight-light', theme.typography.fontWeight.light.toString());
  setCSSVariable(root, '--font-weight-regular', theme.typography.fontWeight.regular.toString());
  setCSSVariable(root, '--font-weight-medium', theme.typography.fontWeight.medium.toString());
  setCSSVariable(root, '--font-weight-bold', theme.typography.fontWeight.bold.toString());
  
  setCSSVariable(root, '--line-height-tight', theme.typography.lineHeight.tight.toString());
  setCSSVariable(root, '--line-height-normal', theme.typography.lineHeight.normal.toString());
  setCSSVariable(root, '--line-height-relaxed', theme.typography.lineHeight.relaxed.toString());
  
  // Set animation variables
  setCSSVariable(root, '--animation-fast', `${theme.animations.duration.fast}ms`);
  setCSSVariable(root, '--animation-normal', `${theme.animations.duration.normal}ms`);
  setCSSVariable(root, '--animation-slow', `${theme.animations.duration.slow}ms`);
  
  setCSSVariable(root, '--easing-standard', theme.animations.easing.standard);
  setCSSVariable(root, '--easing-bounce', theme.animations.easing.bounce);
  setCSSVariable(root, '--easing-smooth', theme.animations.easing.smooth);
  
  // Set effect variables
  setCSSVariable(root, '--blur-sm', theme.effects.blur.sm);
  setCSSVariable(root, '--blur-md', theme.effects.blur.md);
  setCSSVariable(root, '--blur-lg', theme.effects.blur.lg);
  
  setCSSVariable(root, '--shadow-sm', theme.effects.shadow.sm);
  setCSSVariable(root, '--shadow-md', theme.effects.shadow.md);
  setCSSVariable(root, '--shadow-lg', theme.effects.shadow.lg);
  setCSSVariable(root, '--shadow-glow', theme.effects.shadow.glow);
  
  // Set theme-specific class
  root.setAttribute('data-theme', theme.id);
}

/**
 * Set CSS custom property
 */
function setCSSVariable(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

/**
 * Generate theme CSS
 */
export function generateThemeCSS(theme: Theme): string {
  return `
    :root[data-theme="${theme.id}"] {
      /* Colors */
      --color-bg-primary: ${theme.colors.backgroundPrimary};
      --color-bg-secondary: ${theme.colors.backgroundSecondary};
      --color-bg-tertiary: ${theme.colors.backgroundTertiary};
      
      --color-text-primary: ${theme.colors.textPrimary};
      --color-text-secondary: ${theme.colors.textSecondary};
      --color-text-tertiary: ${theme.colors.textTertiary};
      
      --color-accent-primary: ${theme.colors.accentPrimary};
      --color-accent-secondary: ${theme.colors.accentSecondary};
      
      --color-success: ${theme.colors.success};
      --color-warning: ${theme.colors.warning};
      --color-error: ${theme.colors.error};
      --color-info: ${theme.colors.info};
      
      /* Typography */
      --font-primary: ${theme.typography.fontFamily.primary};
      --font-code: ${theme.typography.fontFamily.code};
      --font-display: ${theme.typography.fontFamily.display};
      
      --font-size-xs: ${theme.typography.fontSize.xs};
      --font-size-sm: ${theme.typography.fontSize.sm};
      --font-size-md: ${theme.typography.fontSize.md};
      --font-size-lg: ${theme.typography.fontSize.lg};
      --font-size-xl: ${theme.typography.fontSize.xl};
      --font-size-xxl: ${theme.typography.fontSize.xxl};
      
      /* Animations */
      --animation-fast: ${theme.animations.duration.fast}ms;
      --animation-normal: ${theme.animations.duration.normal}ms;
      --animation-slow: ${theme.animations.duration.slow}ms;
      
      --easing-standard: ${theme.animations.easing.standard};
      --easing-bounce: ${theme.animations.easing.bounce};
      --easing-smooth: ${theme.animations.easing.smooth};
      
      /* Effects */
      --blur-sm: ${theme.effects.blur.sm};
      --blur-md: ${theme.effects.blur.md};
      --blur-lg: ${theme.effects.blur.lg};
      
      --shadow-sm: ${theme.effects.shadow.sm};
      --shadow-md: ${theme.effects.shadow.md};
      --shadow-lg: ${theme.effects.shadow.lg};
      --shadow-glow: ${theme.effects.shadow.glow};
    }
  `;
}