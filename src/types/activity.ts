// src/types/activity.ts

/**
 * Represents activity timeline events
 */
export interface Activity {
  id: string;
  projectId: string;
  timestamp: Date;
  type: ActivityType;
  data: ActivityData;
  importance: ImportanceLevel;
}

export enum ActivityType {
  COMMIT = 'commit',
  FILE_CHANGE = 'file_change',
  DOCUMENTATION = 'documentation',
  MILESTONE = 'milestone',
  TASK_UPDATE = 'task_update',
  BUILD = 'build',
  DEPLOYMENT = 'deployment',
  ERROR = 'error',
  REVIEW = 'review'
}

export interface ActivityData {
  title: string;
  description?: string;
  author?: string;
  metadata: Record<string, any>;
}

export enum ImportanceLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface CommitActivity extends ActivityData {
  hash: string;
  message: string;
  author: string;
  additions: number;
  deletions: number;
  files: string[];
}

export interface MilestoneActivity extends ActivityData {
  name: string;
  completed: boolean;
  dueDate?: Date;
  completedDate?: Date;
}

export interface TimelineFilter {
  startDate?: Date;
  endDate?: Date;
  types?: ActivityType[];
  projects?: string[];
  importance?: ImportanceLevel[];
  author?: string;
}

export interface TimelineScale {
  unit: TimeUnit;
  range: number;
  format: string;
}

export enum TimeUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// Activity statistics for heatmap
export interface ActivityStats {
  date: Date;
  commits: number;
  additions: number;
  deletions: number;
  files: number;
  intensity: number; // 0-1
}

export interface DayActivity {
  date: Date;
  activities: Activity[];
  stats: ActivityStats;
}

export class ActivityValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'ActivityValidationError';
  }
}