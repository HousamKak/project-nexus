// src/themes/cosmic-dark.ts

import { createTheme } from './base-theme';

/**
 * Cosmic Dark theme - Deep space with neon accents
 */
export const cosmicDarkTheme = createTheme(
  'cosmic-dark',
  'Cosmic Dark',
  'A deep space theme with vibrant cosmic colors and smooth animations',
  {
    colors: {
      // Dark space backgrounds
      backgroundPrimary: '#0A0B0F',
      backgroundSecondary: '#141520',
      backgroundTertiary: '#1F2132',
      
      // Light text for contrast
      textPrimary: '#FFFFFF',
      textSecondary: '#B8C1D6',
      textTertiary: '#6B7280',
      
      // Vibrant blue accents
      accentPrimary: '#4A90E2',
      accentSecondary: '#67A4FF',
      
      // Status colors with cosmic twist
      success: '#00D9FF',
      warning: '#FFB84D',
      error: '#FF5757',
      info: '#B47AFF',
      
      // Galaxy specific
      starfield: '#FFFFFF',
      nebula: [
        '#4A90E2',  // Blue
        '#B47AFF',  // Purple
        '#00D9FF',  // Cyan
        '#FF5757',  // Red
        '#FFB84D'   // Orange
      ],
      planetGlow: '#67A4FF',
      orbitRing: '#2A2D3A',
      
      // Code syntax - inspired by space
      syntax: {
        keyword: '#B47AFF',
        string: '#00D9FF',
        number: '#FFB84D',
        comment: '#6B7280',
        function: '#67A4FF',
        variable: '#FFFFFF',
        class: '#FF5757',
        operator: '#B8C1D6'
      }
    },
    
    effects: {
      shadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px rgba(0, 0, 0, 0.6)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
        glow: '0 0 30px rgba(74, 144, 226, 0.4)'
      },
      particles: {
        enabled: true,
        density: 1.5,
        speed: 0.8
      }
    }
  }
);

/**
 * Apply cosmic dark theme-specific styles
 */
export function applyCosmicDarkStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    [data-theme="cosmic-dark"] {
      /* Gradient backgrounds */
      --gradient-bg: radial-gradient(
        ellipse at top,
        #141520 0%,
        #0A0B0F 100%
      );
      
      /* Nebula effects */
      --nebula-gradient: radial-gradient(
        circle at 20% 80%,
        rgba(74, 144, 226, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(180, 122, 255, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 40%,
        rgba(0, 217, 255, 0.05) 0%,
        transparent 50%
      );
      
      /* Glow effects */
      --text-glow: 0 0 10px rgba(255, 255, 255, 0.2);
      --accent-glow: 0 0 20px rgba(74, 144, 226, 0.5);
      
      /* Special effects */
      --star-twinkle: star-twinkle 3s ease-in-out infinite;
    }
    
    /* Animations */
    @keyframes star-twinkle {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    /* Galaxy specific styles */
    [data-theme="cosmic-dark"] .galaxy-canvas {
      background: var(--gradient-bg);
    }
    
    [data-theme="cosmic-dark"] .galaxy-canvas::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--nebula-gradient);
      pointer-events: none;
    }
    
    /* Planet glow effects */
    [data-theme="cosmic-dark"] .planet {
      box-shadow: 
        0 0 20px rgba(103, 164, 255, 0.6),
        0 0 40px rgba(103, 164, 255, 0.3),
        inset 0 0 20px rgba(103, 164, 255, 0.2);
    }
    
    /* Interactive elements */
    [data-theme="cosmic-dark"] .interactive:hover {
      filter: brightness(1.2);
      box-shadow: var(--accent-glow);
      transform: translateY(-2px);
      transition: all 0.3s ease;
    }
    
    /* Navigation styling */
    [data-theme="cosmic-dark"] .nav-button {
      color: var(--color-text-secondary);
      transition: color 0.3s ease;
    }
    
    [data-theme="cosmic-dark"] .nav-button:hover {
      color: var(--color-accent-primary);
      text-shadow: var(--text-glow);
    }
    
    /* Status bar */
    [data-theme="cosmic-dark"] .status-bar {
      background: rgba(20, 21, 32, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Modals */
    [data-theme="cosmic-dark"] .modal {
      background: var(--color-bg-secondary);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 20px 25px -5px rgba(0, 0, 0, 0.5),
        0 10px 10px -5px rgba(0, 0, 0, 0.4);
    }
    
    /* Scrollbars */
    [data-theme="cosmic-dark"] ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    [data-theme="cosmic-dark"] ::-webkit-scrollbar-track {
      background: var(--color-bg-primary);
    }
    
    [data-theme="cosmic-dark"] ::-webkit-scrollbar-thumb {
      background: var(--color-bg-tertiary);
      border-radius: 4px;
    }
    
    [data-theme="cosmic-dark"] ::-webkit-scrollbar-thumb:hover {
      background: var(--color-accent-primary);
    }
    
    /* Loading animation */
    [data-theme="cosmic-dark"] .loading-logo {
      animation: pulse-glow 2s ease-in-out infinite;
    }
    
    @keyframes pulse-glow {
      0%, 100% {
        filter: brightness(1);
        transform: scale(1);
      }
      50% {
        filter: brightness(1.2) drop-shadow(0 0 20px rgba(74, 144, 226, 0.6));
        transform: scale(1.05);
      }
    }
    
    /* Project cards */
    [data-theme="cosmic-dark"] .project-card {
      background: rgba(31, 33, 50, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    
    [data-theme="cosmic-dark"] .project-card:hover {
      border-color: var(--color-accent-primary);
      transform: translateY(-4px);
      box-shadow: 
        0 10px 20px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(74, 144, 226, 0.2);
    }
    
    /* Code preview */
    [data-theme="cosmic-dark"] .code-preview {
      background: rgba(10, 11, 15, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-family: var(--font-code);
    }
    
    /* Timeline */
    [data-theme="cosmic-dark"] .timeline-event {
      background: rgba(31, 33, 50, 0.6);
      border-left: 3px solid var(--color-accent-primary);
    }
    
    [data-theme="cosmic-dark"] .timeline-event:hover {
      background: rgba(31, 33, 50, 0.9);
      box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
    }
    
    /* Tooltips */
    [data-theme="cosmic-dark"] .tooltip {
      background: rgba(10, 11, 15, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    
    /* Context menu */
    [data-theme="cosmic-dark"] .context-menu {
      background: rgba(20, 21, 32, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
    }
    
    [data-theme="cosmic-dark"] .context-item:hover {
      background: rgba(74, 144, 226, 0.2);
    }
    
    /* Input fields */
    [data-theme="cosmic-dark"] input,
    [data-theme="cosmic-dark"] textarea,
    [data-theme="cosmic-dark"] select {
      background: rgba(10, 11, 15, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--color-text-primary);
    }
    
    [data-theme="cosmic-dark"] input:focus,
    [data-theme="cosmic-dark"] textarea:focus,
    [data-theme="cosmic-dark"] select:focus {
      border-color: var(--color-accent-primary);
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
      outline: none;
    }
    
    /* Buttons */
    [data-theme="cosmic-dark"] .button-primary {
      background: var(--color-accent-primary);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
    }
    
    [data-theme="cosmic-dark"] .button-primary:hover {
      background: var(--color-accent-secondary);
      box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
      transform: translateY(-2px);
    }
    
    [data-theme="cosmic-dark"] .button-secondary {
      background: transparent;
      color: var(--color-text-primary);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    [data-theme="cosmic-dark"] .button-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--color-accent-primary);
    }
  `;
  
  document.head.appendChild(style);
}