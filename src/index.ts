// src/index.ts
// Main barrel export file for Project Nexus

// Core components
export { GalaxyView } from './core/GalaxyView';
export { FileConstellation } from './core/FileConstellation';
export { Timeline } from './core/Timeline';
export { ProjectManager } from './core/ProjectManager';
export { StorageManager } from './core/StorageManager';

// Types
export * from './types/project';
export * from './types/file';
export * from './types/activity';
export * from './types/theme';

// Utilities
export * from './utils/validation';
export * from './utils/errors';
export * from './utils/canvas';
export * from './utils/animations';

// Themes
export { cosmicDarkTheme } from './themes/cosmic-dark';
export { terminalGreenTheme } from './themes/terminal-green';
export { createTheme, applyThemeToCSS } from './themes/base-theme';

// Main application
export { default } from './app';