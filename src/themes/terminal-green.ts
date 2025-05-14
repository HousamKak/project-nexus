// src/themes/terminal-green.ts

import { createTheme } from './base-theme';

/**
 * Terminal Green theme - Retro matrix-style terminal
 */
export const terminalGreenTheme = createTheme(
  'terminal-green',
  'Terminal Green',
  'A retro terminal theme with classic green phosphor glow',
  {
    colors: {
      // Dark terminal backgrounds
      backgroundPrimary: '#000000',
      backgroundSecondary: '#0A0F0A',
      backgroundTertiary: '#141E14',
      
      // Classic terminal green text
      textPrimary: '#00FF41',
      textSecondary: '#00CC33',
      textTertiary: '#008F28',
      
      // Green accent colors
      accentPrimary: '#00FF41',
      accentSecondary: '#33FF66',
      
      // Terminal status colors
      success: '#00FF00',
      warning: '#FFFF00',
      error: '#FF0040',
      info: '#00FFFF',
      
      // Galaxy specific
      starfield: '#00FF41',
      nebula: [
        '#00FF41',  // Primary green
        '#00FF00',  // Bright green
        '#00CC33',  // Medium green
        '#008F28',  // Dark green
        '#00FFFF'   // Cyan accent
      ],
      planetGlow: '#00FF41',
      orbitRing: '#003311',
      
      // Code syntax - terminal style
      syntax: {
        keyword: '#00FFFF',
        string: '#FFFF00',
        number: '#FF00FF',
        comment: '#008F28',
        function: '#00FF41',
        variable: '#00CC33',
        class: '#00FFFF',
        operator: '#00FF00'
      }
    },
    
    typography: {
      fontFamily: {
        primary: '"Courier New", Consolas, monospace',
        code: '"Courier New", Consolas, monospace',
        display: '"Courier New", Consolas, monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        xxl: '1.5rem'
      },
      fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    
    effects: {
      shadow: {
        sm: '0 0 5px rgba(0, 255, 65, 0.5)',
        md: '0 0 10px rgba(0, 255, 65, 0.5)',
        lg: '0 0 20px rgba(0, 255, 65, 0.5)',
        glow: '0 0 30px rgba(0, 255, 65, 0.8)'
      },
      particles: {
        enabled: true,
        density: 2,
        speed: 0.5
      }
    }
  }
);

/**
 * Apply terminal green theme-specific styles
 */
export function applyTerminalGreenStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    [data-theme="terminal-green"] {
      /* Terminal gradient backgrounds */
      --gradient-bg: radial-gradient(
        ellipse at center,
        #0A0F0A 0%,
        #000000 100%
      );
      
      /* Scanline effect */
      --scanline: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 65, 0.03) 2px,
        rgba(0, 255, 65, 0.03) 4px
      );
      
      /* CRT monitor curve effect */
      --crt-curve: radial-gradient(
        ellipse at center,
        rgba(0, 255, 65, 0.1) 0%,
        transparent 70%
      );
      
      /* Phosphor glow */
      --phosphor-glow: 0 0 10px rgba(0, 255, 65, 0.7);
      
      /* Flicker animation */
      --flicker: flicker 0.15s infinite;
      
      /* Terminal cursor */
      --cursor-blink: cursor-blink 1s steps(2) infinite;
    }
    
    /* Apply scanline effect to main containers */
    [data-theme="terminal-green"]::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--scanline);
      pointer-events: none;
      z-index: 1;
    }
    
    /* Terminal specific animations */
    @keyframes flicker {
      0% { opacity: 0.87; }
      50% { opacity: 0.82; }
      100% { opacity: 0.87; }
    }
    
    @keyframes cursor-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    
    @keyframes text-glow {
      0%, 100% { text-shadow: 0 0 4px currentColor; }
      50% { text-shadow: 0 0 8px currentColor, 0 0 12px currentColor; }
    }
    
    /* Terminal text styling */
    [data-theme="terminal-green"] * {
      font-family: var(--font-code) !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    [data-theme="terminal-green"] h1,
    [data-theme="terminal-green"] h2,
    [data-theme="terminal-green"] h3 {
      animation: text-glow 2s ease-in-out infinite;
    }
    
    /* Terminal cursor for inputs */
    [data-theme="terminal-green"] input,
    [data-theme="terminal-green"] textarea {
      background: #000000;
      border: 1px solid #00FF41;
      color: #00FF41;
      caret-color: #00FF41;
      text-transform: none;
    }
    
    [data-theme="terminal-green"] input:focus,
    [data-theme="terminal-green"] textarea:focus {
      box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
      outline: none;
    }
    
    /* Terminal buttons */
    [data-theme="terminal-green"] button,
    [data-theme="terminal-green"] .button-primary,
    [data-theme="terminal-green"] .button-secondary {
      background: transparent;
      border: 1px solid #00FF41;
      color: #00FF41;
      text-shadow: 0 0 4px currentColor;
      position: relative;
      overflow: hidden;
    }
    
    [data-theme="terminal-green"] button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.4), transparent);
      transition: left 0.5s;
    }
    
    [data-theme="terminal-green"] button:hover::before {
      left: 100%;
    }
    
    [data-theme="terminal-green"] button:hover {
      box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
      text-shadow: 0 0 8px currentColor;
    }
    
    /* Terminal navigation */
    [data-theme="terminal-green"] .top-nav {
      background: #000000;
      border-bottom: 1px solid #00FF41;
      position: relative;
    }
    
    [data-theme="terminal-green"] .top-nav::after {
      content: 'SYSTEM READY';
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #00FF41;
      font-size: 0.75rem;
      animation: var(--cursor-blink);
    }
    
    /* Terminal status bar */
    [data-theme="terminal-green"] .status-bar {
      background: #000000;
      border-top: 1px solid #00FF41;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    
    /* Terminal project cards */
    [data-theme="terminal-green"] .project-item {
      background: rgba(0, 15, 0, 0.7);
      border: 1px solid #00FF41;
      position: relative;
    }
    
    [data-theme="terminal-green"] .project-item::before {
      content: '>';
      position: absolute;
      left: 0.5rem;
      color: #00FF41;
      animation: var(--cursor-blink);
    }
    
    [data-theme="terminal-green"] .project-item:hover {
      background: rgba(0, 255, 65, 0.1);
      box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
    }
    
    /* Terminal galaxy view */
    [data-theme="terminal-green"] .galaxy-canvas {
      filter: contrast(1.2);
      animation: var(--flicker);
    }
    
    /* Terminal planets */
    [data-theme="terminal-green"] .planet {
      border: 1px solid #00FF41;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.6);
    }
    
    /* Terminal modals */
    [data-theme="terminal-green"] .modal {
      background: #000000;
      border: 2px solid #00FF41;
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.8);
    }
    
    [data-theme="terminal-green"] .modal::before {
      content: 'TERMINAL v1.0.0';
      position: absolute;
      top: 0.5rem;
      left: 1rem;
      font-size: 0.75rem;
      color: #00FF41;
      opacity: 0.7;
    }
    
    /* Terminal loading screen */
    [data-theme="terminal-green"] .loading-screen {
      background: #000000;
      color: #00FF41;
    }
    
    [data-theme="terminal-green"] .loading-message::after {
      content: '_';
      animation: var(--cursor-blink);
    }
    
    /* Terminal code blocks */
    [data-theme="terminal-green"] code,
    [data-theme="terminal-green"] pre {
      background: #000000;
      border: 1px solid #00FF41;
      color: #00FF41;
      padding: 0.5rem;
      box-shadow: inset 0 0 10px rgba(0, 255, 65, 0.1);
    }
    
    /* Terminal scrollbars */
    [data-theme="terminal-green"] ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
      background: #000000;
    }
    
    [data-theme="terminal-green"] ::-webkit-scrollbar-track {
      background: #000000;
      border: 1px solid #00FF41;
    }
    
    [data-theme="terminal-green"] ::-webkit-scrollbar-thumb {
      background: #00FF41;
      border: 1px solid #000000;
    }
    
    [data-theme="terminal-green"] ::-webkit-scrollbar-thumb:hover {
      background: #33FF66;
      box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
    }
    
    /* Terminal tooltips */
    [data-theme="terminal-green"] .tooltip {
      background: #000000;
      border: 1px solid #00FF41;
      color: #00FF41;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    
    /* Terminal selection */
    [data-theme="terminal-green"] ::selection {
      background: #00FF41;
      color: #000000;
    }
    
    /* ASCII art decorations */
    [data-theme="terminal-green"] .ascii-border {
      border: none;
      padding: 1rem;
      position: relative;
    }
    
    [data-theme="terminal-green"] .ascii-border::before {
      content: '┌─────────────────────────────────┐';
      position: absolute;
      top: 0;
      left: 0;
      color: #00FF41;
    }
    
    [data-theme="terminal-green"] .ascii-border::after {
      content: '└─────────────────────────────────┘';
      position: absolute;
      bottom: 0;
      left: 0;
      color: #00FF41;
    }
    
    /* Matrix rain effect (optional) */
    [data-theme="terminal-green"] .matrix-rain {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.1;
      z-index: 0;
    }
    
    /* CRT monitor effect */
    [data-theme="terminal-green"] .app-container {
      position: relative;
      border-radius: 20px;
      box-shadow: 
        inset 0 0 20px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(0, 255, 65, 0.3);
    }
    
    [data-theme="terminal-green"] .app-container::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--crt-curve);
      pointer-events: none;
      z-index: 1;
    }
  `;
  
  document.head.appendChild(style);
}