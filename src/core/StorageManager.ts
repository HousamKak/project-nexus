// src/core/StorageManager.ts

import { Project } from '../types/project';
import { FileNode } from '../types/file';
import { Activity } from '../types/activity';
import { Theme, UserPreferences } from '../types/theme';
import { ValidationError } from '../utils/errors';

/**
 * Manages persistent storage for Project Nexus
 * Uses IndexedDB for large data and localStorage for preferences
 */
export class StorageManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ProjectNexusDB';
  private readonly DB_VERSION = 1;
  
  private readonly STORES = {
    PROJECTS: 'projects',
    FILES: 'files',
    ACTIVITIES: 'activities',
    THEMES: 'themes'
  };
  
  private readonly LOCAL_KEYS = {
    USER_PREFERENCES: 'nexus_user_preferences',
    ACTIVE_THEME: 'nexus_active_theme',
    CAMERA_STATE: 'nexus_camera_state',
    RECENT_PROJECTS: 'nexus_recent_projects'
  };

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  public async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(new Error('Failed to initialize database'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(this.STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(this.STORES.PROJECTS, { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('status', 'status', { unique: false });
          projectStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.FILES)) {
          const fileStore = db.createObjectStore(this.STORES.FILES, { keyPath: 'id' });
          fileStore.createIndex('projectId', 'projectId', { unique: false });
          fileStore.createIndex('type', 'type', { unique: false });
          fileStore.createIndex('modified', 'activity.modified', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.ACTIVITIES)) {
          const activityStore = db.createObjectStore(this.STORES.ACTIVITIES, { keyPath: 'id' });
          activityStore.createIndex('projectId', 'projectId', { unique: false });
          activityStore.createIndex('timestamp', 'timestamp', { unique: false });
          activityStore.createIndex('type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.THEMES)) {
          const themeStore = db.createObjectStore(this.STORES.THEMES, { keyPath: 'id' });
          themeStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db;
  }

  // Project operations

  /**
   * Save a project
   */
  public async saveProject(project: Project): Promise<void> {
    if (!project || !project.id) {
      throw new ValidationError('project', project, 'Invalid project: missing id');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.PROJECTS], 'readwrite');
    const store = transaction.objectStore(this.STORES.PROJECTS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(this.serializeProject(project));
      
      request.onsuccess = () => {
        this.updateRecentProjects(project.id);
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to save project: ${request.error}`));
      };
    });
  }

  /**
   * Get a project by ID
   */
  public async getProject(projectId: string): Promise<Project | null> {
    if (!projectId) {
      throw new ValidationError('projectId', projectId, 'Project ID is required');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.PROJECTS], 'readonly');
    const store = transaction.objectStore(this.STORES.PROJECTS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? this.deserializeProject(data) : null);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get project: ${request.error}`));
      };
    });
  }

  /**
   * Get all projects
   */
  public async getAllProjects(): Promise<Project[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.PROJECTS], 'readonly');
    const store = transaction.objectStore(this.STORES.PROJECTS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data.map(p => this.deserializeProject(p)));
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all projects: ${request.error}`));
      };
    });
  }

  /**
   * Delete a project
   */
  public async deleteProject(projectId: string): Promise<void> {
    if (!projectId) {
      throw new ValidationError('projectId', projectId, 'Project ID is required');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction(
      [this.STORES.PROJECTS, this.STORES.FILES, this.STORES.ACTIVITIES],
      'readwrite'
    );
    
    // Delete project
    const projectStore = transaction.objectStore(this.STORES.PROJECTS);
    await this.promisifyRequest(projectStore.delete(projectId));
    
    // Delete associated files
    const fileStore = transaction.objectStore(this.STORES.FILES);
    const fileIndex = fileStore.index('projectId');
    const fileCursor = fileIndex.openCursor(IDBKeyRange.only(projectId));
    
    await this.deleteWithCursor(fileCursor);
    
    // Delete associated activities
    const activityStore = transaction.objectStore(this.STORES.ACTIVITIES);
    const activityIndex = activityStore.index('projectId');
    const activityCursor = activityIndex.openCursor(IDBKeyRange.only(projectId));
    
    await this.deleteWithCursor(activityCursor);
    
    // Remove from recent projects
    this.removeFromRecentProjects(projectId);
  }

  // File operations

  /**
   * Save files for a project
   */
  public async saveFiles(files: FileNode[]): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.FILES], 'readwrite');
    const store = transaction.objectStore(this.STORES.FILES);
    
    const promises = files.map(file => {
      if (!file.id || !file.projectId) {
        throw new ValidationError('file', file, 'Invalid file: missing id or projectId');
      }
      
      return this.promisifyRequest(store.put(this.serializeFile(file)));
    });
    
    await Promise.all(promises);
  }

  /**
   * Get files for a project
   */
  public async getProjectFiles(projectId: string): Promise<FileNode[]> {
    if (!projectId) {
      throw new ValidationError('projectId', projectId, 'Project ID is required');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.FILES], 'readonly');
    const store = transaction.objectStore(this.STORES.FILES);
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data.map(f => this.deserializeFile(f)));
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get project files: ${request.error}`));
      };
    });
  }

  /**
   * Delete a file
   */
  public async deleteFile(fileId: string): Promise<void> {
    if (!fileId) {
      throw new ValidationError('fileId', fileId, 'File ID is required');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.FILES], 'readwrite');
    const store = transaction.objectStore(this.STORES.FILES);
    
    await this.promisifyRequest(store.delete(fileId));
  }

  // Activity operations

  /**
   * Save activities
   */
  public async saveActivities(activities: Activity[]): Promise<void> {
    if (!activities || activities.length === 0) {
      return;
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.ACTIVITIES], 'readwrite');
    const store = transaction.objectStore(this.STORES.ACTIVITIES);
    
    const promises = activities.map(activity => {
      if (!activity.id || !activity.projectId) {
        throw new ValidationError('activity', activity, 'Invalid activity: missing id or projectId');
      }
      
      return this.promisifyRequest(store.put(this.serializeActivity(activity)));
    });
    
    await Promise.all(promises);
  }

  /**
   * Get activities for a project
   */
  public async getProjectActivities(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Activity[]> {
    if (!projectId) {
      throw new ValidationError('projectId', projectId, 'Project ID is required');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.ACTIVITIES], 'readonly');
    const store = transaction.objectStore(this.STORES.ACTIVITIES);
    const index = store.index('projectId');
    
    const activities: Activity[] = [];
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId));
      
      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor) {
          const activity = this.deserializeActivity(cursor.value);
          
          // Filter by date range if provided
          if ((!startDate || activity.timestamp >= startDate) &&
              (!endDate || activity.timestamp <= endDate)) {
            activities.push(activity);
          }
          
          cursor.continue();
        } else {
          resolve(activities);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get project activities: ${request.error}`));
      };
    });
  }

  // Theme operations

  /**
   * Save a theme
   */
  public async saveTheme(theme: Theme): Promise<void> {
    if (!theme || !theme.id) {
      throw new ValidationError('theme', theme, 'Invalid theme: missing id');
    }
    
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.THEMES], 'readwrite');
    const store = transaction.objectStore(this.STORES.THEMES);
    
    await this.promisifyRequest(store.put(theme));
  }

  /**
   * Get all themes
   */
  public async getAllThemes(): Promise<Theme[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.STORES.THEMES], 'readonly');
    const store = transaction.objectStore(this.STORES.THEMES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get all themes: ${request.error}`));
      };
    });
  }

  // Local storage operations

  /**
   * Save user preferences
   */
  public saveUserPreferences(preferences: UserPreferences): void {
    if (!preferences) {
      throw new ValidationError('preferences', preferences, 'Preferences are required');
    }
    
    localStorage.setItem(
      this.LOCAL_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );
  }

  /**
   * Get user preferences
   */
  public getUserPreferences(): UserPreferences | null {
    const data = localStorage.getItem(this.LOCAL_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Save active theme ID
   */
  public saveActiveThemeId(themeId: string): void {
    if (!themeId) {
      throw new ValidationError('themeId', themeId, 'Theme ID is required');
    }
    
    localStorage.setItem(this.LOCAL_KEYS.ACTIVE_THEME, themeId);
  }

  /**
   * Get active theme ID
   */
  public getActiveThemeId(): string | null {
    return localStorage.getItem(this.LOCAL_KEYS.ACTIVE_THEME);
  }

  /**
   * Save camera state
   */
  public saveCameraState(state: any): void {
    localStorage.setItem(
      this.LOCAL_KEYS.CAMERA_STATE,
      JSON.stringify(state)
    );
  }

  /**
   * Get camera state
   */
  public getCameraState(): any | null {
    const data = localStorage.getItem(this.LOCAL_KEYS.CAMERA_STATE);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get recent projects
   */
  public getRecentProjects(): string[] {
    const data = localStorage.getItem(this.LOCAL_KEYS.RECENT_PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Update recent projects list
   */
  private updateRecentProjects(projectId: string): void {
    const recent = this.getRecentProjects();
    const filtered = recent.filter(id => id !== projectId);
    const updated = [projectId, ...filtered].slice(0, 10); // Keep last 10
    
    localStorage.setItem(
      this.LOCAL_KEYS.RECENT_PROJECTS,
      JSON.stringify(updated)
    );
  }

  /**
   * Remove from recent projects
   */
  private removeFromRecentProjects(projectId: string): void {
    const recent = this.getRecentProjects();
    const filtered = recent.filter(id => id !== projectId);
    
    localStorage.setItem(
      this.LOCAL_KEYS.RECENT_PROJECTS,
      JSON.stringify(filtered)
    );
  }

  // Serialization helpers

  /**
   * Serialize project for storage
   */
  private serializeProject(project: Project): any {
    return {
      ...project,
      created: project.created.getTime(),
      lastModified: project.lastModified.getTime()
    };
  }

  /**
   * Deserialize project from storage
   */
  private deserializeProject(data: any): Project {
    return {
      ...data,
      created: new Date(data.created),
      lastModified: new Date(data.lastModified)
    };
  }

  /**
   * Serialize file for storage
   */
  private serializeFile(file: FileNode): any {
    return {
      ...file,
      activity: {
        ...file.activity,
        created: file.activity.created.getTime(),
        modified: file.activity.modified.getTime(),
        accessed: file.activity.accessed.getTime()
      }
    };
  }

  /**
   * Deserialize file from storage
   */
  private deserializeFile(data: any): FileNode {
    return {
      ...data,
      activity: {
        ...data.activity,
        created: new Date(data.activity.created),
        modified: new Date(data.activity.modified),
        accessed: new Date(data.activity.accessed)
      }
    };
  }

  /**
   * Serialize activity for storage
   */
  private serializeActivity(activity: Activity): any {
    return {
      ...activity,
      timestamp: activity.timestamp.getTime()
    };
  }

  /**
   * Deserialize activity from storage
   */
  private deserializeActivity(data: any): Activity {
    return {
      ...data,
      timestamp: new Date(data.timestamp)
    };
  }

  // Utility methods

  /**
   * Convert IndexedDB request to promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all items with cursor
   */
  private deleteWithCursor(cursorRequest: IDBRequest<IDBCursorWithValue | null>): Promise<void> {
    return new Promise((resolve, reject) => {
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      cursorRequest.onerror = () => {
        reject(new Error(`Failed to delete with cursor: ${cursorRequest.error}`));
      };
    });
  }

  /**
   * Clear all data (for development/testing)
   */
  public async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    // Clear IndexedDB
    const transaction = db.transaction(
      Object.values(this.STORES),
      'readwrite'
    );
    
    const promises = Object.values(this.STORES).map(storeName => {
      const store = transaction.objectStore(storeName);
      return this.promisifyRequest(store.clear());
    });
    
    await Promise.all(promises);
    
    // Clear localStorage
    Object.values(this.LOCAL_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Export all data
   */
  public async exportData(): Promise<any> {
    const projects = await this.getAllProjects();
    const themes = await this.getAllThemes();
    
    const projectData: any = {};
    
    for (const project of projects) {
      const files = await this.getProjectFiles(project.id);
      const activities = await this.getProjectActivities(project.id);
      
      projectData[project.id] = {
        project,
        files,
        activities
      };
    }
    
    return {
      version: this.DB_VERSION,
      exportDate: new Date().toISOString(),
      projects: projectData,
      themes,
      preferences: this.getUserPreferences(),
      activeTheme: this.getActiveThemeId()
    };
  }

  /**
   * Import data
   */
  public async importData(data: any): Promise<void> {
    if (!data || data.version !== this.DB_VERSION) {
      throw new ValidationError('data', data, 'Invalid or incompatible data format');
    }
    
    // Clear existing data
    await this.clearAllData();
    
    // Import themes
    if (data.themes) {
      for (const theme of data.themes) {
        await this.saveTheme(theme);
      }
    }
    
    // Import projects
    if (data.projects) {
      for (const projectId in data.projects) {
        const projectData = data.projects[projectId];
        
        await this.saveProject(projectData.project);
        await this.saveFiles(projectData.files);
        await this.saveActivities(projectData.activities);
      }
    }
    
    // Import preferences
    if (data.preferences) {
      this.saveUserPreferences(data.preferences);
    }
    
    // Import active theme
    if (data.activeTheme) {
      this.saveActiveThemeId(data.activeTheme);
    }
  }

  /**
   * Get storage usage statistics
   */
  public async getStorageStats(): Promise<StorageStats> {
    const db = await this.ensureDB();
    const transaction = db.transaction(Object.values(this.STORES), 'readonly');
    
    const stats: StorageStats = {
      projects: 0,
      files: 0,
      activities: 0,
      themes: 0,
      totalSize: 0
    };
    
    // Count records in each store
    for (const storeName of Object.values(this.STORES)) {
      const store = transaction.objectStore(storeName);
      const count = await this.promisifyRequest(store.count());
      
      switch (storeName) {
        case this.STORES.PROJECTS:
          stats.projects = count;
          break;
        case this.STORES.FILES:
          stats.files = count;
          break;
        case this.STORES.ACTIVITIES:
          stats.activities = count;
          break;
        case this.STORES.THEMES:
          stats.themes = count;
          break;
      }
    }
    
    // Estimate storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      stats.totalSize = estimate.usage || 0;
      stats.quota = estimate.quota || 0;
    }
    
    return stats;
  }
}

// Storage statistics interface
interface StorageStats {
  projects: number;
  files: number;
  activities: number;
  themes: number;
  totalSize: number;
  quota?: number;
}