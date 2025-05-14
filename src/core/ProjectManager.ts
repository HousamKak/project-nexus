// src/core/ProjectManager.ts

import { Project, ProjectStatus, ProjectStats } from '../types/project';
import { FileNode } from '../types/file';
import { Activity, ActivityType } from '../types/activity';
import { StorageManager } from './StorageManager';
import { ValidationError } from '../utils/errors';
import { Validator } from '../utils/validation';

/**
 * Manages project operations and state
 */
export class ProjectManager {
  private storageManager: StorageManager;
  private projects: Map<string, Project>;
  private currentProjectId: string | null = null;
  private listeners: Map<string, Set<ProjectEventListener>>;

  constructor(storageManager: StorageManager) {
    if (!storageManager) {
      throw new ValidationError('storageManager', storageManager, 'Storage manager is required');
    }
    
    this.storageManager = storageManager;
    this.projects = new Map();
    this.listeners = new Map();
    
    this.initializeListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeListeners(): void {
    const eventTypes = [
      'projectAdded',
      'projectUpdated',
      'projectRemoved',
      'projectSelected',
      'filesAdded',
      'filesRemoved',
      'activityAdded'
    ];
    
    eventTypes.forEach(type => {
      this.listeners.set(type, new Set());
    });
  }

  /**
   * Load all projects from storage
   */
  public async loadProjects(): Promise<Project[]> {
    try {
      const projects = await this.storageManager.getAllProjects();
      
      projects.forEach(project => {
        this.projects.set(project.id, project);
      });
      
      return projects;
    } catch (error) {
      throw new Error(`Failed to load projects: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new project
   */
  public async createProject(projectData: Partial<Project>): Promise<Project> {
    // Validate required fields
    if (!projectData.name) {
      throw new ValidationError('name', projectData.name, 'Project name is required');
    }
    
    if (!projectData.path) {
      throw new ValidationError('path', projectData.path, 'Project path is required');
    }
    
    // Create project object
    const project: Project = {
      id: this.generateId(),
      name: projectData.name,
      description: projectData.description || '',
      path: projectData.path,
      gitUrl: projectData.gitUrl,
      created: new Date(),
      lastModified: new Date(),
      status: projectData.status || ProjectStatus.ACTIVE,
      stats: projectData.stats || this.getDefaultStats(),
      position: projectData.position || this.generateDefaultPosition(),
      theme: projectData.theme || this.getDefaultTheme(),
      tags: projectData.tags || [],
      dependencies: projectData.dependencies || []
    };
    
    // Validate complete project
    Validator.validateProject(project);
    
    // Save to storage
    await this.storageManager.saveProject(project);
    
    // Add to memory
    this.projects.set(project.id, project);
    
    // Notify listeners
    this.emit('projectAdded', { project });
    
    return project;
  }

  /**
   * Update an existing project
   */
  public async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    // Apply updates
    const updatedProject = {
      ...project,
      ...updates,
      lastModified: new Date()
    };
    
    // Validate updated project
    Validator.validateProject(updatedProject);
    
    // Save to storage
    await this.storageManager.saveProject(updatedProject);
    
    // Update in memory
    this.projects.set(projectId, updatedProject);
    
    // Notify listeners
    this.emit('projectUpdated', { project: updatedProject, updates });
    
    return updatedProject;
  }

  /**
   * Delete a project
   */
  public async deleteProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    // Delete from storage (cascades to files and activities)
    await this.storageManager.deleteProject(projectId);
    
    // Remove from memory
    this.projects.delete(projectId);
    
    // Clear current project if it was deleted
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }
    
    // Notify listeners
    this.emit('projectRemoved', { projectId });
  }

  /**
   * Get a project by ID
   */
  public getProject(projectId: string): Project | null {
    return this.projects.get(projectId) || null;
  }

  /**
   * Get all projects
   */
  public getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  /**
   * Get projects by status
   */
  public getProjectsByStatus(status: ProjectStatus): Project[] {
    return this.getAllProjects().filter(project => project.status === status);
  }

  /**
   * Search projects
   */
  public searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAllProjects().filter(project => {
      return project.name.toLowerCase().includes(lowerQuery) ||
             project.description.toLowerCase().includes(lowerQuery) ||
             project.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
  }

  /**
   * Set current project
   */
  public setCurrentProject(projectId: string | null): void {
    if (projectId && !this.projects.has(projectId)) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    this.currentProjectId = projectId;
    
    if (projectId) {
      const project = this.projects.get(projectId)!;
      this.emit('projectSelected', { project });
    }
  }

  /**
   * Get current project
   */
  public getCurrentProject(): Project | null {
    if (!this.currentProjectId) return null;
    return this.projects.get(this.currentProjectId) || null;
  }

  /**
   * Add files to a project
   */
  public async addFilesToProject(projectId: string, files: FileNode[]): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    // Validate files
    files.forEach(file => {
      if (file.projectId !== projectId) {
        throw new ValidationError('file.projectId', file.projectId, 'File project ID mismatch');
      }
      Validator.validateFile(file);
    });
    
    // Save files
    await this.storageManager.saveFiles(files);
    
    // Update project stats
    const currentStats = await this.calculateProjectStats(projectId);
    await this.updateProject(projectId, { stats: currentStats });
    
    // Create activity
    const activity: Activity = {
      id: this.generateId(),
      projectId,
      timestamp: new Date(),
      type: ActivityType.FILE_CHANGE,
      data: {
        title: `Added ${files.length} files`,
        metadata: {
          fileCount: files.length,
          fileNames: files.map(f => f.name)
        }
      },
      importance: 2
    };
    
    await this.addActivity(activity);
    
    // Notify listeners
    this.emit('filesAdded', { projectId, files });
  }

  /**
   * Remove files from a project
   */
  public async removeFilesFromProject(projectId: string, fileIds: string[]): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    // Delete files
    for (const fileId of fileIds) {
      await this.storageManager.deleteFile(fileId);
    }
    
    // Update project stats
    const currentStats = await this.calculateProjectStats(projectId);
    await this.updateProject(projectId, { stats: currentStats });
    
    // Create activity
    const activity: Activity = {
      id: this.generateId(),
      projectId,
      timestamp: new Date(),
      type: ActivityType.FILE_CHANGE,
      data: {
        title: `Removed ${fileIds.length} files`,
        metadata: {
          fileCount: fileIds.length,
          fileIds
        }
      },
      importance: 2
    };
    
    await this.addActivity(activity);
    
    // Notify listeners
    this.emit('filesRemoved', { projectId, fileIds });
  }

  /**
   * Get files for a project
   */
  public async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    return await this.storageManager.getProjectFiles(projectId);
  }

  /**
   * Add activity to a project
   */
  public async addActivity(activity: Activity): Promise<void> {
    const project = this.projects.get(activity.projectId);
    if (!project) {
      throw new ValidationError('activity.projectId', activity.projectId, 'Project not found');
    }
    
    // Validate activity
    Validator.validateActivity(activity);
    
    // Save activity
    await this.storageManager.saveActivities([activity]);
    
    // Update project last modified
    await this.updateProject(activity.projectId, {
      lastModified: new Date()
    });
    
    // Notify listeners
    this.emit('activityAdded', { activity });
  }

  /**
   * Get activities for a project
   */
  public async getProjectActivities(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Activity[]> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    return await this.storageManager.getProjectActivities(projectId, startDate, endDate);
  }

  /**
   * Calculate project statistics
   */
  public async calculateProjectStats(projectId: string): Promise<ProjectStats> {
    const files = await this.getProjectFiles(projectId);
    const activities = await this.getProjectActivities(projectId);
    
    // Calculate file statistics
    let totalLines = 0;
    const languageCounts = new Map<string, number>();
    
    files.forEach(file => {
      // Estimate lines based on file size (rough approximation)
      const estimatedLines = Math.ceil(file.size / 50);
      totalLines += estimatedLines;
      
      // Count languages
      const language = this.getLanguageFromFileType(file.type);
      if (language) {
        languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
      }
    });
    
    // Calculate language distribution
    const totalFiles = files.length;
    const languages = Array.from(languageCounts.entries())
      .map(([name, count]) => ({
        name,
        percentage: (count / totalFiles) * 100,
        color: this.getLanguageColor(name)
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // Calculate commit count
    const commits = activities.filter(a => a.type === ActivityType.COMMIT).length;
    
    // Calculate health score (simplified)
    let health = 100;
    
    // Deduct for lack of recent activity
    const lastActivity = activities[activities.length - 1];
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastActivity > 30) health -= 20;
      else if (daysSinceLastActivity > 14) health -= 10;
      else if (daysSinceLastActivity > 7) health -= 5;
    }
    
    // Deduct for lack of documentation
    const docFiles = files.filter(f => f.metadata.extension === '.md' || f.metadata.extension === '.txt');
    const docRatio = docFiles.length / totalFiles;
    if (docRatio < 0.05) health -= 15;
    else if (docRatio < 0.1) health -= 10;
    
    // Deduct for no tests
    const testFiles = files.filter(f => f.path.includes('test') || f.path.includes('spec'));
    if (testFiles.length === 0) health -= 20;
    
    // Ensure health is between 0 and 100
    health = Math.max(0, Math.min(100, health));
    
    return {
      files: totalFiles,
      lines: totalLines,
      commits,
      languages,
      health,
      testCoverage: testFiles.length > 0 ? Math.random() * 50 + 50 : 0 // Mock test coverage
    };
  }

  /**
   * Clone a project
   */
  public async cloneProject(projectId: string, newName: string): Promise<Project> {
    const sourceProject = this.projects.get(projectId);
    if (!sourceProject) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    // Create new project with cloned data
    const clonedProject = await this.createProject({
      ...sourceProject,
      id: undefined, // Will be generated
      name: newName,
      created: new Date(),
      lastModified: new Date(),
      stats: { ...sourceProject.stats },
      position: this.generateDefaultPosition(),
      tags: [...sourceProject.tags],
      dependencies: [...sourceProject.dependencies]
    });
    
    // Clone files
    const files = await this.getProjectFiles(projectId);
    const clonedFiles = files.map(file => ({
      ...file,
      id: this.generateId(),
      projectId: clonedProject.id,
      activity: {
        ...file.activity,
        created: new Date(),
        modified: new Date()
      }
    }));
    
    await this.addFilesToProject(clonedProject.id, clonedFiles);
    
    return clonedProject;
  }

  /**
   * Export project data
   */
  public async exportProject(projectId: string): Promise<ProjectExport> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }
    
    const files = await this.getProjectFiles(projectId);
    const activities = await this.getProjectActivities(projectId);
    
    return {
      project,
      files,
      activities,
      exportDate: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * Import project data
   */
  public async importProject(data: ProjectExport): Promise<Project> {
    // Validate import data
    if (!data.project || !data.files || !data.activities) {
      throw new ValidationError('data', data, 'Invalid import data');
    }
    
    // Create new project with imported data
    const importedProject = await this.createProject({
      ...data.project,
      id: undefined, // Generate new ID
      created: new Date(),
      lastModified: new Date()
    });
    
    // Import files
    const importedFiles = data.files.map(file => ({
      ...file,
      id: this.generateId(),
      projectId: importedProject.id
    }));
    
    await this.addFilesToProject(importedProject.id, importedFiles);
    
    // Import activities
    const importedActivities = data.activities.map(activity => ({
      ...activity,
      id: this.generateId(),
      projectId: importedProject.id
    }));
    
    for (const activity of importedActivities) {
      await this.addActivity(activity);
    }
    
    return importedProject;
  }

  /**
   * Calculate project dependencies
   */
  public async calculateDependencies(projectId: string): Promise<string[]> {
    const files = await this.getProjectFiles(projectId);
    const dependencies = new Set<string>();
    
    // Analyze file imports/requires
    files.forEach(file => {
      if (file.metadata.dependencies) {
        file.metadata.dependencies.forEach(dep => dependencies.add(dep));
      }
    });
    
    // Look for package.json, requirements.txt, etc.
    const packageFiles = files.filter(f => 
      f.name === 'package.json' ||
      f.name === 'requirements.txt' ||
      f.name === 'Cargo.toml' ||
      f.name === 'go.mod'
    );
    
    // In a real implementation, we would parse these files
    // For now, return mock dependencies
    if (packageFiles.length > 0) {
      dependencies.add('react');
      dependencies.add('typescript');
      dependencies.add('webpack');
    }
    
    return Array.from(dependencies);
  }

  /**
   * Subscribe to events
   */
  public on(event: string, listener: ProjectEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * Unsubscribe from events
   */
  public off(event: string, listener: ProjectEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get default stats for a new project
   */
  private getDefaultStats(): ProjectStats {
    return {
      files: 0,
      lines: 0,
      commits: 0,
      languages: [],
      health: 100
    };
  }

  /**
   * Generate default position for a new project
   */
  private generateDefaultPosition(): any {
    return {
      ring: 1,
      angle: Math.random() * 360,
      size: 'medium',
      velocity: 0.02
    };
  }

  /**
   * Get default theme for a new project
   */
  private getDefaultTheme(): any {
    const colors = ['#4A90E2', '#50C878', '#FFB84D', '#E74C3C', '#9B59B6', '#1ABC9C'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      color: randomColor,
      texture: 'swirl',
      glow: true
    };
  }

  /**
   * Get language from file type
   */
  private getLanguageFromFileType(fileType: string): string | null {
    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      rust: 'Rust',
      go: 'Go',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS'
    };
    
    return languageMap[fileType] || null;
  }

  /**
   * Get color for a programming language
   */
  private getLanguageColor(language: string): string {
    const colorMap: Record<string, string> = {
      JavaScript: '#F0DB4F',
      TypeScript: '#3178C6',
      Python: '#3776AB',
      Java: '#007396',
      'C++': '#00599C',
      Rust: '#CE422B',
      Go: '#00ADD8',
      HTML: '#E34C26',
      CSS: '#1572B6',
      SCSS: '#CC6699'
    };
    
    return colorMap[language] || '#999999';
  }
}

// Types
type ProjectEventListener = (data: any) => void;

interface ProjectExport {
  project: Project;
  files: FileNode[];
  activities: Activity[];
  exportDate: Date;
  version: string;
}