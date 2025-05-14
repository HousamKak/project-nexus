# Project Nexus API Documentation

## Overview

Project Nexus provides a comprehensive API for managing projects, files, and activities in a visual galaxy interface. This document covers all public APIs and their usage.

## Core Components

### GalaxyView

The main visualization component that renders projects as planets in an orbital system.

```typescript
class GalaxyView {
  constructor(canvas: HTMLCanvasElement, theme: Theme)
  
  // Project Management
  addProject(project: Project): void
  removeProject(projectId: string): void
  updateProject(projectId: string, updates: Partial<Project>): void
  
  // Camera Control
  getCameraState(): Camera
  setCameraState(camera: Partial<Camera>): void
  focusProject(projectId: string, animated?: boolean): void
  
  // Theme
  setTheme(theme: Theme): void
  
  // Cleanup
  destroy(): void
}
```

#### Events

- `projectSelected`: Fired when a project is selected
  ```typescript
  canvas.addEventListener('projectSelected', (e: CustomEvent) => {
    const { project } = e.detail;
    console.log('Selected project:', project);
  });
  ```

### StorageManager

Handles all data persistence using IndexedDB and localStorage.

```typescript
class StorageManager {
  constructor()
  
  // Database Initialization
  initializeDB(): Promise<void>
  
  // Project Operations
  saveProject(project: Project): Promise<void>
  getProject(projectId: string): Promise<Project | null>
  getAllProjects(): Promise<Project[]>
  deleteProject(projectId: string): Promise<void>
  
  // File Operations
  saveFiles(files: FileNode[]): Promise<void>
  getProjectFiles(projectId: string): Promise<FileNode[]>
  deleteFile(fileId: string): Promise<void>
  
  // Activity Operations
  saveActivities(activities: Activity[]): Promise<void>
  getProjectActivities(projectId: string, startDate?: Date, endDate?: Date): Promise<Activity[]>
  
  // Theme Operations
  saveTheme(theme: Theme): Promise<void>
  getAllThemes(): Promise<Theme[]>
  
  // User Preferences
  saveUserPreferences(preferences: UserPreferences): void
  getUserPreferences(): UserPreferences | null
  saveActiveThemeId(themeId: string): void
  getActiveThemeId(): string | null
  
  // Import/Export
  exportData(): Promise<any>
  importData(data: any): Promise<void>
  
  // Storage Management
  getStorageStats(): Promise<StorageStats>
  clearAllData(): Promise<void>
}
```

### ProjectManager

Manages project operations and business logic.

```typescript
class ProjectManager {
  constructor(storageManager: StorageManager)
  
  // Project Lifecycle
  loadProjects(): Promise<Project[]>
  createProject(projectData: Partial<Project>): Promise<Project>
  updateProject(projectId: string, updates: Partial<Project>): Promise<Project>
  deleteProject(projectId: string): Promise<void>
  cloneProject(projectId: string, newName: string): Promise<Project>
  
  // Project Queries
  getProject(projectId: string): Project | null
  getAllProjects(): Project[]
  getProjectsByStatus(status: ProjectStatus): Project[]
  searchProjects(query: string): Project[]
  
  // Current Project
  setCurrentProject(projectId: string | null): void
  getCurrentProject(): Project | null
  
  // File Management
  addFilesToProject(projectId: string, files: FileNode[]): Promise<void>
  removeFilesFromProject(projectId: string, fileIds: string[]): Promise<void>
  getProjectFiles(projectId: string): Promise<FileNode[]>
  
  // Activity Management
  addActivity(activity: Activity): Promise<void>
  getProjectActivities(projectId: string, startDate?: Date, endDate?: Date): Promise<Activity[]>
  
  // Statistics
  calculateProjectStats(projectId: string): Promise<ProjectStats>
  calculateDependencies(projectId: string): Promise<string[]>
  
  // Import/Export
  exportProject(projectId: string): Promise<ProjectExport>
  importProject(data: ProjectExport): Promise<Project>
  
  // Event Handling
  on(event: string, listener: (data: any) => void): void
  off(event: string, listener: (data: any) => void): void
}
```

#### Events

- `projectAdded`: Fired when a project is added
- `projectUpdated`: Fired when a project is updated
- `projectRemoved`: Fired when a project is removed
- `projectSelected`: Fired when a project is selected
- `filesAdded`: Fired when files are added
- `filesRemoved`: Fired when files are removed
- `activityAdded`: Fired when an activity is added

### FileConstellation

Visualizes files as an interconnected constellation.

```typescript
class FileConstellation {
  constructor(canvas: HTMLCanvasElement, theme: Theme)
  
  // File Management
  addFiles(files: FileNode[]): void
  removeFiles(fileIds: string[]): void
  updateFile(fileId: string, updates: Partial<FileNode>): void
  
  // Filtering
  filterFiles(filter: FileFilter): void
  
  // Navigation
  focusFile(fileId: string, animated?: boolean): void
  
  // Theme
  setTheme(theme: Theme): void
  
  // Cleanup
  destroy(): void
}
```

#### Events

- `fileSelected`: Fired when files are selected
  ```typescript
  canvas.addEventListener('fileSelected', (e: CustomEvent) => {
    const { files } = e.detail;
    console.log('Selected files:', files);
  });
  ```

### Timeline

Displays project activities in chronological order.

```typescript
class Timeline {
  constructor(canvas: HTMLCanvasElement, theme: Theme)
  
  // Activity Management
  setActivities(activities: Activity[]): void
  addActivities(activities: Activity[]): void
  removeActivities(activityIds: string[]): void
  
  // Time Controls
  setScale(unit: TimeUnit): void
  focusTimeRange(startTime: Date, endTime: Date, animated?: boolean): void
  
  // Filtering
  setFilters(filters: TimelineFilter): void
  
  // Theme
  setTheme(theme: Theme): void
  
  // Cleanup
  destroy(): void
}
```

#### Events

- `activitySelected`: Fired when activities are selected
- `activityOpen`: Fired when an activity is double-clicked
- `deleteActivities`: Fired when delete key is pressed on selected activities

## Data Types

### Project

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  created: Date;
  lastModified: Date;
  path: string;
  gitUrl?: string;
  stats: ProjectStats;
  position: ProjectPosition;
  theme: ProjectTheme;
  status: ProjectStatus;
  tags: string[];
  dependencies: string[];
}
```

### FileNode

```typescript
interface FileNode {
  id: string;
  projectId: string;
  name: string;
  path: string;
  type: FileType;
  size: number;
  content: FileContent;
  visual: FileVisual;
  activity: FileActivity;
  metadata: FileMetadata;
}
```

### Activity

```typescript
interface Activity {
  id: string;
  projectId: string;
  timestamp: Date;
  type: ActivityType;
  data: ActivityData;
  importance: ImportanceLevel;
}
```

### Theme

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: Typography;
  animations: AnimationSettings;
  effects: EffectSettings;
}
```

## Error Handling

All API methods that can fail will throw specific error types:

```typescript
try {
  await projectManager.createProject(projectData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.field, error.message);
  } else if (error instanceof StorageError) {
    console.error('Storage operation failed:', error.operation);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Animation System

The animation system provides smooth transitions:

```typescript
const animationManager = new AnimationManager();

// Simple animation
animationManager.animate('myAnimation', {
  from: { x: 0, opacity: 0 },
  to: { x: 100, opacity: 1 },
  duration: 1000,
  easing: 'easeInOutCubic',
  onUpdate: (value) => {
    element.style.transform = `translateX(${value.x}px)`;
    element.style.opacity = value.opacity;
  },
  onComplete: () => {
    console.log('Animation complete');
  }
});

// Stop animation
animationManager.stop('myAnimation');
```

## Theme System

Create custom themes by extending the base theme:

```typescript
import { createTheme } from './themes/base-theme';

const myTheme = createTheme(
  'my-theme',
  'My Custom Theme',
  'A beautiful custom theme',
  {
    colors: {
      backgroundPrimary: '#1a1a1a',
      textPrimary: '#ffffff',
      accentPrimary: '#00ff88'
    }
  }
);

// Apply theme
galaxyView.setTheme(myTheme);
```

## Validation

Use the validation utilities to ensure data integrity:

```typescript
import { Validator } from './utils/validation';

// Validate project data
try {
  Validator.validateProject(projectData);
} catch (error) {
  console.error('Invalid project data:', error);
}

// Type guards
if (Validator.isString(value)) {
  // value is guaranteed to be a string
}
```

## Canvas Utilities

Helper functions for canvas operations:

```typescript
import { CanvasUtils } from './utils/canvas';

// Setup high DPI canvas
CanvasUtils.setupHighDPI(canvas);

// Draw operations
CanvasUtils.drawCircle(ctx, x, y, radius, fillColor, strokeColor);
CanvasUtils.drawText(ctx, text, x, y, font, color);

// Transformations
CanvasUtils.transform(ctx, translateX, translateY, scaleX, scaleY, rotation);

// Mouse position
const pos = CanvasUtils.getMousePos(canvas, event);
```

## Usage Examples

### Creating a New Project

```typescript
const projectManager = new ProjectManager(storageManager);

const project = await projectManager.createProject({
  name: 'My Awesome Project',
  description: 'A revolutionary new app',
  path: '/home/user/projects/awesome',
  gitUrl: 'https://github.com/user/awesome',
  status: ProjectStatus.ACTIVE,
  theme: {
    color: '#4A90E2',
    texture: 'swirl',
    glow: true
  }
});

// Add to galaxy view
galaxyView.addProject(project);
```

### Adding Files to a Project

```typescript
const files: FileNode[] = [
  {
    id: generateId(),
    projectId: project.id,
    name: 'index.js',
    path: 'src/index.js',
    type: FileType.JAVASCRIPT,
    size: 2048,
    visual: {
      cluster: FileCluster.CODE,
      connections: ['utils.js', 'api.js']
    },
    activity: {
      created: new Date(),
      modified: new Date(),
      heat: 0.8
    }
  }
];

await projectManager.addFilesToProject(project.id, files);
```

### Recording an Activity

```typescript
const activity: Activity = {
  id: generateId(),
  projectId: project.id,
  timestamp: new Date(),
  type: ActivityType.COMMIT,
  data: {
    title: 'Added user authentication',
    description: 'Implemented JWT-based auth system',
    metadata: {
      hash: 'abc123',
      files: ['auth.js', 'user.js'],
      additions: 150,
      deletions: 20
    }
  },
  importance: ImportanceLevel.HIGH
};

await projectManager.addActivity(activity);
```

### Searching Projects

```typescript
// Search by name or tags
const results = projectManager.searchProjects('react');

// Filter by status
const activeProjects = projectManager.getProjectsByStatus(ProjectStatus.ACTIVE);

// Get current project
const current = projectManager.getCurrentProject();
```

### Handling Events

```typescript
// Listen for project selection in galaxy
galaxyCanvas.addEventListener('projectSelected', (e: CustomEvent) => {
  const { project } = e.detail;
  
  // Update UI
  updateProjectInfo(project);
  
  // Load project files
  loadProjectFiles(project.id);
});

// Listen for file selection in constellation
constellationCanvas.addEventListener('fileSelected', (e: CustomEvent) => {
  const { files } = e.detail;
  
  // Show file details
  showFileDetails(files);
});

// Listen for activity selection in timeline
timelineCanvas.addEventListener('activitySelected', (e: CustomEvent) => {
  const { activities } = e.detail;
  
  // Display activity info
  displayActivityInfo(activities);
});
```

### Import/Export

```typescript
// Export all data
const exportData = await storageManager.exportData();
const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
const url = URL.createObjectURL(blob);

// Download link
const link = document.createElement('a');
link.href = url;
link.download = 'project-nexus-backup.json';
link.click();

// Import data
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = JSON.parse(text);
  
  await storageManager.importData(data);
  location.reload(); // Refresh to see imported data
};
fileInput.click();
```

## Best Practices

1. **Always validate input data** using the Validator class
2. **Handle errors appropriately** with try-catch blocks
3. **Use TypeScript's type system** for compile-time safety
4. **Clean up resources** by calling destroy() methods
5. **Subscribe to events** for reactive UI updates
6. **Use animations** for smooth visual transitions
7. **Test thoroughly** with different data scenarios
8. **Document your code** with JSDoc comments

## Performance Considerations

- **Canvas rendering**: Use requestAnimationFrame for smooth animations
- **Data loading**: Load projects incrementally for large datasets
- **Memory management**: Remove event listeners and clean up references
- **IndexedDB**: Use transactions efficiently for bulk operations
- **Throttling**: Debounce/throttle expensive operations like search

## Browser Compatibility

Project Nexus requires modern browser features:
- ES2020 JavaScript
- Canvas API
- IndexedDB
- Service Workers
- CSS Custom Properties
- CSS Grid/Flexbox

Supported browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+