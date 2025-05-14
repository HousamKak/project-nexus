// src/types/file.ts

/**
 * Represents a file in the constellation view
 */
export interface FileNode {
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

export interface FileContent {
  preview: string;
  hash: string;
  encoding: string;
  mimeType: string;
  language?: string;
}

export interface FileVisual {
  x: number;
  y: number;
  z?: number; // for 3D view
  cluster: FileCluster;
  connections: string[]; // IDs of connected files
  color?: string;
  size: number; // visual size based on importance
}

export enum FileCluster {
  CODE = 'code',
  DOCUMENTATION = 'documentation',
  CONFIGURATION = 'configuration',
  MEDIA = 'media',
  DATA = 'data',
  TEST = 'test'
}

export interface FileActivity {
  created: Date;
  modified: Date;
  accessed: Date;
  commits: number;
  heat: number; // 0-1, recent activity level
  authors: string[];
}

export interface FileMetadata {
  extension: string;
  permissions?: string;
  gitStatus?: GitFileStatus;
  dependencies?: string[];
  exports?: string[];
  todos?: number;
  complexity?: number;
}

export enum FileType {
  // Code
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CPP = 'cpp',
  RUST = 'rust',
  GO = 'go',
  
  // Web
  HTML = 'html',
  CSS = 'css',
  SCSS = 'scss',
  
  // Data
  JSON = 'json',
  XML = 'xml',
  YAML = 'yaml',
  CSV = 'csv',
  
  // Documentation
  MARKDOWN = 'markdown',
  TEXT = 'text',
  PDF = 'pdf',
  
  // Media
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  
  // Other
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

export enum GitFileStatus {
  UNMODIFIED = 'unmodified',
  MODIFIED = 'modified',
  STAGED = 'staged',
  UNTRACKED = 'untracked',
  IGNORED = 'ignored',
  CONFLICT = 'conflict'
}

export interface FileFilter {
  types?: FileType[];
  clusters?: FileCluster[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  searchQuery?: string;
}

export class FileValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}