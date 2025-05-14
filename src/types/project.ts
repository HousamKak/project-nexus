// src/types/project.ts

/**
 * Represents a project in the galaxy view
 */
export interface Project {
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

export interface ProjectStats {
  files: number;
  lines: number;
  commits: number;
  languages: Language[];
  testCoverage?: number;
  health: number; // 0-100
}

export interface Language {
  name: string;
  percentage: number;
  color: string;
}

export interface ProjectPosition {
  ring: OrbitalRing;
  angle: number; // 0-360 degrees
  size: PlanetSize;
  velocity: number; // orbital speed
}

export enum OrbitalRing {
  ACTIVE = 1,
  ONGOING = 2,
  ARCHIVED = 3
}

export enum PlanetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export interface ProjectTheme {
  color: string;
  texture: TextureType;
  glow: boolean;
  particleEffect?: ParticleType;
}

export enum TextureType {
  SWIRL = 'swirl',
  GRID = 'grid',
  ORGANIC = 'organic',
  CRYSTALLINE = 'crystalline'
}

export enum ParticleType {
  SPARKLE = 'sparkle',
  PULSE = 'pulse',
  ORBIT = 'orbit'
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface ProjectUpdate {
  field: keyof Project;
  value: any;
  timestamp: Date;
}

export class ProjectValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}