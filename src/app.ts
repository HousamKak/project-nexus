// src/app.ts

import { GalaxyView } from './core/GalaxyView';
import { StorageManager } from './core/StorageManager';
import { ProjectManager } from './core/ProjectManager';
import { FileConstellation } from './core/FileConstellation';
import { Timeline } from './core/Timeline';
import { Theme, UserPreferences } from './types/theme';
import { Project, ProjectStatus, OrbitalRing, PlanetSize } from './types/project';
import { cosmicDarkTheme, applyCosmicDarkStyles } from './themes/cosmic-dark';
import { terminalGreenTheme, applyTerminalGreenStyles } from './themes/terminal-green';
import { applyThemeToCSS } from './themes/base-theme';
import { ErrorHandler } from './utils/errors';
import { Validator } from './utils/validation';

/**
 * Main application class for Project Nexus
 */
export class ProjectNexus {
  private galaxyView: GalaxyView | null = null;
  private constellation: FileConstellation | null = null;
  private timeline: Timeline | null = null;
  private storageManager: StorageManager;
  private projectManager: ProjectManager;
  
  private currentTheme: Theme;
  private preferences: UserPreferences;
  private views: Map<string, HTMLElement>;
  private currentView: string = 'galaxy';
  
  private isInitialized: boolean = false;

  constructor() {
    this.storageManager = new StorageManager();
    this.projectManager = new ProjectManager(this.storageManager);
    this.currentTheme = cosmicDarkTheme;
    this.preferences = this.getDefaultPreferences();
    this.views = new Map();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    try {
      // Show loading screen
      this.showLoadingScreen(true);
      
      // Initialize storage
      await this.storageManager.initializeDB();
      
      // Load user preferences
      await this.loadPreferences();
      
      // Apply theme
      await this.loadAndApplyTheme();
      
      // Setup UI
      this.setupUI();
      
      // Initialize views
      await this.initializeViews();
      
      // Load projects
      await this.loadProjects();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Hide loading screen
      this.showLoadingScreen(false);
      this.showApp(true);
      
      this.isInitialized = true;
      console.log('Project Nexus initialized successfully');
      
      // Register service worker for offline support
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => console.log('Service Worker registered:', registration))
          .catch(error => console.error('Service Worker registration failed:', error));
      }
      
    } catch (error) {
      ErrorHandler.handle(error as Error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'cosmic-dark',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      firstDayOfWeek: 0,
      animations: true,
      soundEffects: false,
      autoSave: true,
      keyboardShortcuts: true
    };
  }

  /**
   * Load user preferences
   */
  private async loadPreferences(): Promise<void> {
    const saved = this.storageManager.getUserPreferences();
    if (saved) {
      this.preferences = { ...this.preferences, ...saved };
    }
  }

  /**
   * Load and apply theme
   */
  private async loadAndApplyTheme(): Promise<void> {
    const themeId = this.storageManager.getActiveThemeId() || 'cosmic-dark';
    
    // Get theme from available themes
    switch (themeId) {
      case 'cosmic-dark':
        this.currentTheme = cosmicDarkTheme;
        applyCosmicDarkStyles();
        break;
      case 'terminal-green':
        this.currentTheme = terminalGreenTheme;
        applyTerminalGreenStyles();
        break;
      default:
        this.currentTheme = cosmicDarkTheme;
    }
    
    applyThemeToCSS(this.currentTheme);
  }

  /**
   * Setup UI elements
   */
  private setupUI(): void {
    // Get view containers
    this.views.set('galaxy', document.getElementById('galaxy-view')!);
    this.views.set('timeline', document.getElementById('timeline-view')!);
    this.views.set('constellation', document.getElementById('constellation-view')!);
    this.views.set('grid', document.getElementById('grid-view')!);
    
    // Update current time
    setInterval(() => {
      const timeEl = document.getElementById('current-time');
      if (timeEl) {
        timeEl.textContent = new Date().toLocaleTimeString();
      }
    }, 1000);
  }

  /**
   * Initialize views
   */
  private async initializeViews(): Promise<void> {
    // Initialize Galaxy View
    const galaxyCanvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement;
    if (galaxyCanvas) {
      this.galaxyView = new GalaxyView(galaxyCanvas, this.currentTheme);
      
      // Restore camera state
      const savedCamera = this.storageManager.getCameraState();
      if (savedCamera) {
        this.galaxyView.setCameraState(savedCamera);
      }
    }
    
    // Initialize Timeline
    const timelineCanvas = document.getElementById('timeline-canvas') as HTMLCanvasElement;
    if (timelineCanvas) {
      this.timeline = new Timeline(timelineCanvas, this.currentTheme);
    }
    
    // Initialize File Constellation
    const constellationCanvas = document.getElementById('constellation-canvas') as HTMLCanvasElement;
    if (constellationCanvas) {
      this.constellation = new FileConstellation(constellationCanvas, this.currentTheme);
    }
  }

  /**
   * Load projects from storage
   */
  private async loadProjects(): Promise<void> {
    const projects = await this.storageManager.getAllProjects();
    
    for (const project of projects) {
      if (this.galaxyView) {
        this.galaxyView.addProject(project);
      }
      this.updateProjectList(project);
    }
    
    // If no projects, show welcome message
    if (projects.length === 0) {
      this.showWelcomeMessage();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Navigation buttons
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      this.toggleSidePanel();
    });
    
    document.getElementById('view-toggle')?.addEventListener('click', () => {
      this.cycleView();
    });
    
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettings();
    });
    
    // Project management
    document.getElementById('add-project')?.addEventListener('click', () => {
      this.showAddProjectModal();
    });
    
    // Search
    document.getElementById('global-search')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleSearch(target.value);
    });
    
    // File drop
    this.setupFileDrop();
    
    // Keyboard shortcuts
    if (this.preferences.keyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
    
    // Galaxy events
    const galaxyCanvas = document.getElementById('galaxy-canvas');
    if (galaxyCanvas) {
      galaxyCanvas.addEventListener('projectSelected', (e: any) => {
        this.handleProjectSelection(e.detail.project);
      });
    }
    
    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Online/offline status
    window.addEventListener('online', () => {
      this.updateOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
      this.updateOnlineStatus(false);
    });
  }

  /**
   * Toggle side panel
   */
  private toggleSidePanel(): void {
    const sidePanel = document.getElementById('side-panel');
    if (sidePanel) {
      sidePanel.classList.toggle('collapsed');
    }
  }

  /**
   * Cycle through views
   */
  private cycleView(): void {
    const viewOrder = ['galaxy', 'timeline', 'constellation', 'grid'];
    const currentIndex = viewOrder.indexOf(this.currentView);
    const nextIndex = (currentIndex + 1) % viewOrder.length;
    this.switchView(viewOrder[nextIndex]);
  }

  /**
   * Switch to a specific view
   */
  private switchView(viewName: string): void {
    // Hide all views
    this.views.forEach((view, name) => {
      view.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = this.views.get(viewName);
    if (selectedView) {
      selectedView.classList.add('active');
      this.currentView = viewName;
      
      // Update status bar
      const viewEl = document.getElementById('current-view');
      if (viewEl) {
        viewEl.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1) + ' View';
      }
    }
  }

  /**
   * Toggle theme
   */
  private toggleTheme(): void {
    // Simple theme toggle for demo
    const currentThemeId = this.currentTheme.id;
    const newThemeId = currentThemeId === 'cosmic-dark' ? 'terminal-green' : 'cosmic-dark';
    
    this.storageManager.saveActiveThemeId(newThemeId);
    this.loadAndApplyTheme();
    
    // Update all views with new theme
    if (this.galaxyView) {
      this.galaxyView.setTheme(this.currentTheme);
    }
    
    if (this.timeline) {
      this.timeline.setTheme(this.currentTheme);
    }
    
    if (this.constellation) {
      this.constellation.setTheme(this.currentTheme);
    }
  }

  /**
   * Show settings modal
   */
  private showSettings(): void {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
      overlay.style.display = 'flex';
      modal.style.display = 'block';
      
      // Setup settings handlers
      this.setupSettingsHandlers();
    }
  }

  /**
   * Setup settings handlers
   */
  private setupSettingsHandlers(): void {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        this.switchSettingsTab(tabName!);
      });
    });
    
    // Save settings
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Cancel settings
    document.getElementById('cancel-settings')?.addEventListener('click', () => {
      this.closeModal('settings-modal');
    });
    
    // Close button
    document.querySelector('#settings-modal .modal-close')?.addEventListener('click', () => {
      this.closeModal('settings-modal');
    });
  }

  /**
   * Switch settings tab
   */
  private switchSettingsTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-tab') === tabName) {
        button.classList.add('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      }
    });
  }

  /**
   * Save settings
   */
  private saveSettings(): void {
    // Gather settings from form
    const settings: Partial<UserPreferences> = {
      animations: (document.getElementById('animations') as HTMLInputElement)?.checked,
      soundEffects: (document.getElementById('sound-effects') as HTMLInputElement)?.checked,
      autoSave: (document.getElementById('auto-save') as HTMLInputElement)?.checked,
      keyboardShortcuts: (document.getElementById('keyboard-shortcuts') as HTMLInputElement)?.checked
    };
    
    // Update preferences
    this.preferences = { ...this.preferences, ...settings };
    this.storageManager.saveUserPreferences(this.preferences);
    
    // Apply changes
    if (!this.preferences.keyboardShortcuts) {
      this.removeKeyboardShortcuts();
    } else {
      this.setupKeyboardShortcuts();
    }
    
    // Close modal
    this.closeModal('settings-modal');
    
    // Show success toast
    this.showToast('Settings saved successfully', 'success');
  }

  /**
   * Show add project modal
   */
  private showAddProjectModal(): void {
    const modal = document.getElementById('add-project-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
      overlay.style.display = 'flex';
      modal.style.display = 'block';
      
      // Setup add project handlers
      this.setupAddProjectHandlers();
    }
  }

  /**
   * Setup add project handlers
   */
  private setupAddProjectHandlers(): void {
    // Form submission
    const form = document.getElementById('add-project-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddProject();
    });
    
    // Browse button
    document.getElementById('browse-path')?.addEventListener('click', () => {
      this.browseForPath();
    });
    
    // Color selection
    document.querySelectorAll('.color-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.selectProjectColor(target.getAttribute('data-color')!);
      });
    });
    
    // Cancel button
    document.getElementById('cancel-add-project')?.addEventListener('click', () => {
      this.closeModal('add-project-modal');
    });
    
    // Close button
    document.querySelector('#add-project-modal .modal-close')?.addEventListener('click', () => {
      this.closeModal('add-project-modal');
    });
  }

  /**
   * Handle add project form submission
   */
  private async handleAddProject(): Promise<void> {
    try {
      // Get form values
      const name = (document.getElementById('project-name-input') as HTMLInputElement).value;
      const description = (document.getElementById('project-description') as HTMLTextAreaElement).value;
      const path = (document.getElementById('project-path') as HTMLInputElement).value;
      const gitUrl = (document.getElementById('project-git') as HTMLInputElement).value;
      const selectedColor = document.querySelector('.color-option.selected')?.getAttribute('data-color') || '#4A90E2';
      
      // Validate inputs
      Validator.validateString(name, 'name', 1, 100);
      Validator.validateString(path, 'path', 1, 500);
      
      // Create project
      const project: Project = {
        id: this.generateId(),
        name,
        description,
        path,
        created: new Date(),
        lastModified: new Date(),
        status: ProjectStatus.ACTIVE,
        stats: {
          files: 0,
          lines: 0,
          commits: 0,
          languages: [],
          health: 100
        },
        position: {
          ring: OrbitalRing.ACTIVE,
          angle: Math.random() * 360,
          size: PlanetSize.MEDIUM,
          velocity: 0.02
        },
        theme: {
          color: selectedColor,
          texture: 'swirl' as any,
          glow: true
        },
        tags: [],
        dependencies: [],
        ...(gitUrl ? { gitUrl } : {})
      };
      
      // Save project
      await this.storageManager.saveProject(project);
      
      // Add to galaxy
      if (this.galaxyView) {
        this.galaxyView.addProject(project);
      }
      
      // Update project list
      this.updateProjectList(project);
      
      // Close modal
      this.closeModal('add-project-modal');
      
      // Show success toast
      this.showToast(`Project "${name}" created successfully`, 'success');
      
      // Focus on new project
      if (this.galaxyView) {
        this.galaxyView.focusProject(project.id);
      }
      
    } catch (error) {
      ErrorHandler.handle(error as Error);
      this.showToast('Failed to create project', 'error');
    }
  }

  /**
   * Update project list in sidebar
   */
  private updateProjectList(project: Project): void {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;
    
    // Create project item
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.setAttribute('data-project-id', project.id);
    
    projectItem.innerHTML = `
      <div class="project-icon" style="background-color: ${project.theme.color}"></div>
      <div class="project-info">
        <div class="project-name">${project.name}</div>
        <div class="project-stats">${project.stats.files} files • ${project.stats.lines} lines</div>
      </div>
    `;
    
    // Add click handler
    projectItem.addEventListener('click', () => {
      this.selectProject(project.id);
    });
    
    projectList.appendChild(projectItem);
  }

  /**
   * Select a project
   */
  private selectProject(projectId: string): void {
    // Update sidebar selection
    document.querySelectorAll('.project-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-project-id') === projectId) {
        item.classList.add('active');
      }
    });
    
    // Focus in galaxy view
    if (this.galaxyView && this.currentView === 'galaxy') {
      this.galaxyView.focusProject(projectId);
    }
    
    // Update current project
    this.projectManager.setCurrentProject(projectId);
  }

  /**
   * Handle project selection from galaxy
   */
  private handleProjectSelection(project: Project): void {
    // Update project info panel
    const infoPanel = document.getElementById('project-info');
    if (infoPanel) {
      infoPanel.style.display = 'block';
      
      const nameEl = document.getElementById('project-name');
      const fileCountEl = document.getElementById('file-count');
      const lineCountEl = document.getElementById('line-count');
      const lastUpdatedEl = document.getElementById('last-updated');
      
      if (nameEl) nameEl.textContent = project.name;
      if (fileCountEl) fileCountEl.textContent = `${project.stats.files} files`;
      if (lineCountEl) lineCountEl.textContent = `${project.stats.lines} lines`;
      if (lastUpdatedEl) lastUpdatedEl.textContent = this.formatDate(project.lastModified);
    }
    
    // Select in sidebar
    this.selectProject(project.id);
  }

  /**
   * Setup file drop functionality
   */
  private setupFileDrop(): void {
    const dropZone = document.getElementById('drop-zone');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      document.addEventListener(eventName, () => {
        if (dropZone) dropZone.style.display = 'flex';
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, () => {
        if (dropZone) dropZone.style.display = 'none';
      }, false);
    });
    
    // Handle dropped files
    document.addEventListener('drop', (e) => {
      this.handleFileDrop(e);
    }, false);
  }

  /**
   * Handle file drop
   */
  private handleFileDrop(e: DragEvent): void {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    // Process dropped files
    const fileArray = Array.from(files);
    
    // Check if it's a project folder or individual files
    if (fileArray.length === 1 && this.isProjectFolder(fileArray[0])) {
      // Create new project from folder
      this.createProjectFromFolder(fileArray[0]);
    } else {
      // Add files to current project
      const currentProject = this.projectManager.getCurrentProject();
      if (currentProject) {
        this.addFilesToProject(currentProject.id, fileArray);
      } else {
        this.showToast('Please select a project first', 'warning');
      }
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Command/Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.showAddProjectModal();
            break;
          case 's':
            e.preventDefault();
            if (this.preferences.autoSave) {
              this.saveCurrentWork();
            }
            break;
          case '/':
            e.preventDefault();
            document.getElementById('global-search')?.focus();
            break;
        }
      }
      
      // View switching
      if (e.altKey) {
        switch (e.key) {
          case '1':
            this.switchView('galaxy');
            break;
          case '2':
            this.switchView('timeline');
            break;
          case '3':
            this.switchView('constellation');
            break;
          case '4':
            this.switchView('grid');
            break;
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * Remove keyboard shortcuts
   */
  private removeKeyboardShortcuts(): void {
    // Remove by cloning and replacing the document
    const newDoc = document.cloneNode(true) as Document;
    document.replaceChild(newDoc.documentElement, document.documentElement);
  }

  /**
   * Handle global search
   */
  private handleSearch(query: string): void {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }
    
    // Search projects
    const projects = this.projectManager.searchProjects(query);
    
    // Update UI based on search results
    this.updateSearchResults(projects);
  }

  /**
   * Clear search
   */
  private clearSearch(): void {
    // Reset UI to show all projects
    document.querySelectorAll('.project-item').forEach(item => {
      (item as HTMLElement).style.display = 'block';
    });
  }

  /**
   * Update search results
   */
  private updateSearchResults(projects: Project[]): void {
    const projectIds = new Set(projects.map(p => p.id));
    
    document.querySelectorAll('.project-item').forEach(item => {
      const projectId = item.getAttribute('data-project-id');
      if (projectId && projectIds.has(projectId)) {
        (item as HTMLElement).style.display = 'block';
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Update canvas sizes
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    });
  }

  /**
   * Update online status
   */
  private updateOnlineStatus(isOnline: boolean): void {
    const banner = document.getElementById('offline-banner');
    const syncStatus = document.getElementById('sync-status');
    
    if (banner) {
      banner.style.display = isOnline ? 'none' : 'block';
    }
    
    if (syncStatus) {
      syncStatus.textContent = isOnline ? 'Synchronized' : 'Offline Mode';
    }
  }

  /**
   * Close modal
   */
  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
      modal.style.display = 'none';
      overlay.style.display = 'none';
    }
  }

  /**
   * Close all modals
   */
  private closeAllModals(): void {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    
    modals.forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
    });
    
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /**
   * Show loading screen
   */
  private showLoadingScreen(show: boolean): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show app
   */
  private showApp(show: boolean): void {
    const app = document.getElementById('app');
    if (app) {
      app.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  /**
   * Show welcome message
   */
  private showWelcomeMessage(): void {
    setTimeout(() => {
      this.showToast('Welcome to Project Nexus! Click the + button to create your first project.', 'info');
    }, 1000);
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days < 30) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Browse for project path
   */
  private browseForPath(): void {
    // In a real app, this would open a file picker
    // For demo, we'll just show a message
    this.showToast('File picker would open here (not available in web demo)', 'info');
  }

  /**
   * Select project color
   */
  private selectProjectColor(color: string): void {
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.remove('selected');
      if (option.getAttribute('data-color') === color) {
        option.classList.add('selected');
      }
    });
  }

  /**
   * Check if file is a project folder
   */
  private isProjectFolder(file: File): boolean {
    // Simple check - in real app would be more sophisticated
    return file.type === '' || file.type === 'application/x-directory';
  }

  /**
   * Create project from folder
   */
  private createProjectFromFolder(folder: File): void {
    // In real app, would analyze folder contents
    // For demo, we'll show a message
    this.showToast('Creating project from folder (demo mode)', 'info');
  }

  /**
   * Add files to project
   */
  private addFilesToProject(projectId: string, files: File[]): void {
    // In real app, would process and add files
    // For demo, we'll show a message
    this.showToast(`Adding ${files.length} files to project (demo mode)`, 'info');
  }

  /**
   * Save current work
   */
  private saveCurrentWork(): void {
    // Save camera state
    if (this.galaxyView) {
      const cameraState = this.galaxyView.getCameraState();
      this.storageManager.saveCameraState(cameraState);
    }
    
    this.showToast('Work saved successfully', 'success');
  }

  /**
   * Prevent default drag/drop behavior
   */
  private preventDefaults(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ProjectNexus();
  app.initialize();
});

// Export for use in other modules
export default ProjectNexus;