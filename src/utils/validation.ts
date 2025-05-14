// src/utils/validation.ts

import { Project, ProjectStats, ProjectPosition, OrbitalRing, PlanetSize } from '../types/project';
import { FileNode, FileType, FileCluster } from '../types/file';
import { Activity, ActivityType, ImportanceLevel } from '../types/activity';
import { Theme, ThemeColors } from '../types/theme';
import { ValidationError } from './errors';

/**
 * Validation utility class for Project Nexus
 */
export class Validator {
  // Regular expressions
  private static readonly PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    HEX_COLOR: /^#[0-9A-F]{6}$/i,
    FILENAME: /^[^<>:"/\\|?*\x00-\x1F]+$/,
    PATH: /^(\/|[A-Za-z]:\\|\\\\).*$/,
    SEMVER: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  };

  /**
   * Validate project data
   */
  public static validateProject(project: Partial<Project>): void {
    if (!project.id || typeof project.id !== 'string') {
      throw new ValidationError('id', project.id, 'Project ID must be a non-empty string');
    }

    if (!project.name || typeof project.name !== 'string' || project.name.trim().length === 0) {
      throw new ValidationError('name', project.name, 'Project name must be a non-empty string');
    }

    if (project.name.length > 100) {
      throw new ValidationError('name', project.name, 'Project name must be less than 100 characters');
    }

    if (!project.path || typeof project.path !== 'string') {
      throw new ValidationError('path', project.path, 'Project path must be a non-empty string');
    }

    if (!this.isValidPath(project.path)) {
      throw new ValidationError('path', project.path, 'Invalid project path format');
    }

    if (project.gitUrl && !this.PATTERNS.URL.test(project.gitUrl)) {
      throw new ValidationError('gitUrl', project.gitUrl, 'Invalid Git URL format');
    }

    if (project.stats) {
      this.validateProjectStats(project.stats);
    }

    if (project.position) {
      this.validateProjectPosition(project.position);
    }

    if (project.created && !(project.created instanceof Date)) {
      throw new ValidationError('created', project.created, 'Created date must be a Date object');
    }

    if (project.lastModified && !(project.lastModified instanceof Date)) {
      throw new ValidationError('lastModified', project.lastModified, 'Last modified date must be a Date object');
    }
  }

  /**
   * Validate project statistics
   */
  private static validateProjectStats(stats: Partial<ProjectStats>): void {
    if (typeof stats.files !== 'number' || stats.files < 0) {
      throw new ValidationError('stats.files', stats.files, 'File count must be a non-negative number');
    }

    if (typeof stats.lines !== 'number' || stats.lines < 0) {
      throw new ValidationError('stats.lines', stats.lines, 'Line count must be a non-negative number');
    }

    if (typeof stats.commits !== 'number' || stats.commits < 0) {
      throw new ValidationError('stats.commits', stats.commits, 'Commit count must be a non-negative number');
    }

    if (stats.health !== undefined) {
      if (typeof stats.health !== 'number' || stats.health < 0 || stats.health > 100) {
        throw new ValidationError('stats.health', stats.health, 'Health must be a number between 0 and 100');
      }
    }

    if (stats.testCoverage !== undefined) {
      if (typeof stats.testCoverage !== 'number' || stats.testCoverage < 0 || stats.testCoverage > 100) {
        throw new ValidationError('stats.testCoverage', stats.testCoverage, 'Test coverage must be a number between 0 and 100');
      }
    }

    if (stats.languages && !Array.isArray(stats.languages)) {
      throw new ValidationError('stats.languages', stats.languages, 'Languages must be an array');
    }
  }

  /**
   * Validate project position
   */
  private static validateProjectPosition(position: Partial<ProjectPosition>): void {
    if (!Object.values(OrbitalRing).includes(position.ring as OrbitalRing)) {
      throw new ValidationError('position.ring', position.ring, 'Invalid orbital ring value');
    }

    if (typeof position.angle !== 'number' || position.angle < 0 || position.angle >= 360) {
      throw new ValidationError('position.angle', position.angle, 'Angle must be a number between 0 and 360');
    }

    if (!Object.values(PlanetSize).includes(position.size as PlanetSize)) {
      throw new ValidationError('position.size', position.size, 'Invalid planet size value');
    }

    if (typeof position.velocity !== 'number' || position.velocity < 0) {
      throw new ValidationError('position.velocity', position.velocity, 'Velocity must be a non-negative number');
    }
  }

  /**
   * Validate file node data
   */
  public static validateFile(file: Partial<FileNode>): void {
    if (!file.id || typeof file.id !== 'string') {
      throw new ValidationError('id', file.id, 'File ID must be a non-empty string');
    }

    if (!file.projectId || typeof file.projectId !== 'string') {
      throw new ValidationError('projectId', file.projectId, 'Project ID must be a non-empty string');
    }

    if (!file.name || typeof file.name !== 'string') {
      throw new ValidationError('name', file.name, 'File name must be a non-empty string');
    }

    if (!this.PATTERNS.FILENAME.test(file.name)) {
      throw new ValidationError('name', file.name, 'Invalid file name format');
    }

    if (!file.path || typeof file.path !== 'string') {
      throw new ValidationError('path', file.path, 'File path must be a non-empty string');
    }

    if (!Object.values(FileType).includes(file.type as FileType)) {
      throw new ValidationError('type', file.type, 'Invalid file type');
    }

    if (typeof file.size !== 'number' || file.size < 0) {
      throw new ValidationError('size', file.size, 'File size must be a non-negative number');
    }

    if (file.visual) {
      this.validateFileVisual(file.visual);
    }

    if (file.activity) {
      this.validateFileActivity(file.activity);
    }
  }

  /**
   * Validate file visual properties
   */
  private static validateFileVisual(visual: any): void {
    if (typeof visual.x !== 'number') {
      throw new ValidationError('visual.x', visual.x, 'X coordinate must be a number');
    }

    if (typeof visual.y !== 'number') {
      throw new ValidationError('visual.y', visual.y, 'Y coordinate must be a number');
    }

    if (!Object.values(FileCluster).includes(visual.cluster)) {
      throw new ValidationError('visual.cluster', visual.cluster, 'Invalid file cluster');
    }

    if (visual.connections && !Array.isArray(visual.connections)) {
      throw new ValidationError('visual.connections', visual.connections, 'Connections must be an array');
    }

    if (visual.color && !this.PATTERNS.HEX_COLOR.test(visual.color)) {
      throw new ValidationError('visual.color', visual.color, 'Color must be a valid hex color');
    }
  }

  /**
   * Validate file activity
   */
  private static validateFileActivity(activity: any): void {
    if (!(activity.created instanceof Date)) {
      throw new ValidationError('activity.created', activity.created, 'Created date must be a Date object');
    }

    if (!(activity.modified instanceof Date)) {
      throw new ValidationError('activity.modified', activity.modified, 'Modified date must be a Date object');
    }

    if (!(activity.accessed instanceof Date)) {
      throw new ValidationError('activity.accessed', activity.accessed, 'Accessed date must be a Date object');
    }

    if (typeof activity.heat !== 'number' || activity.heat < 0 || activity.heat > 1) {
      throw new ValidationError('activity.heat', activity.heat, 'Heat must be a number between 0 and 1');
    }
  }

  /**
   * Validate activity data
   */
  public static validateActivity(activity: Partial<Activity>): void {
    if (!activity.id || typeof activity.id !== 'string') {
      throw new ValidationError('id', activity.id, 'Activity ID must be a non-empty string');
    }

    if (!activity.projectId || typeof activity.projectId !== 'string') {
      throw new ValidationError('projectId', activity.projectId, 'Project ID must be a non-empty string');
    }

    if (!(activity.timestamp instanceof Date)) {
      throw new ValidationError('timestamp', activity.timestamp, 'Timestamp must be a Date object');
    }

    if (!Object.values(ActivityType).includes(activity.type as ActivityType)) {
      throw new ValidationError('type', activity.type, 'Invalid activity type');
    }

    if (!Object.values(ImportanceLevel).includes(activity.importance as ImportanceLevel)) {
      throw new ValidationError('importance', activity.importance, 'Invalid importance level');
    }

    if (!activity.data || typeof activity.data !== 'object') {
      throw new ValidationError('data', activity.data, 'Activity data must be an object');
    }

    if (!activity.data.title || typeof activity.data.title !== 'string') {
      throw new ValidationError('data.title', activity.data.title, 'Activity title must be a non-empty string');
    }
  }

  /**
   * Validate theme data
   */
  public static validateTheme(theme: Partial<Theme>): void {
    if (!theme.id || typeof theme.id !== 'string') {
      throw new ValidationError('id', theme.id, 'Theme ID must be a non-empty string');
    }

    if (!theme.name || typeof theme.name !== 'string') {
      throw new ValidationError('name', theme.name, 'Theme name must be a non-empty string');
    }

    if (theme.colors) {
      this.validateThemeColors(theme.colors);
    }
  }

  /**
   * Validate theme colors
   */
  private static validateThemeColors(colors: Partial<ThemeColors>): void {
    const colorFields = [
      'backgroundPrimary', 'backgroundSecondary', 'backgroundTertiary',
      'textPrimary', 'textSecondary', 'textTertiary',
      'accentPrimary', 'accentSecondary',
      'success', 'warning', 'error', 'info',
      'starfield', 'planetGlow', 'orbitRing'
    ];

    for (const field of colorFields) {
      const value = colors[field as keyof ThemeColors];
      if (value && typeof value === 'string' && !this.PATTERNS.HEX_COLOR.test(value)) {
        throw new ValidationError(`colors.${field}`, value, 'Invalid hex color format');
      }
    }

    if (colors.nebula && !Array.isArray(colors.nebula)) {
      throw new ValidationError('colors.nebula', colors.nebula, 'Nebula colors must be an array');
    }
  }

  /**
   * Check if value is a valid path
   */
  private static isValidPath(path: string): boolean {
    // Simple path validation - can be enhanced based on OS
    return path.length > 0 && path.length < 260 && !path.includes('\0');
  }

  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    return this.PATTERNS.EMAIL.test(email);
  }

  /**
   * Validate URL format
   */
  public static isValidUrl(url: string): boolean {
    return this.PATTERNS.URL.test(url);
  }

  /**
   * Validate hex color format
   */
  public static isValidHexColor(color: string): boolean {
    return this.PATTERNS.HEX_COLOR.test(color);
  }

  /**
   * Validate semver version format
   */
  public static isValidVersion(version: string): boolean {
    return this.PATTERNS.SEMVER.test(version);
  }

  /**
   * Sanitize string for safe display
   */
  public static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Sanitize file path
   */
  public static sanitizePath(path: string): string {
    return path
      .replace(/[<>:"|?*]/g, '') // Remove invalid path characters
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .replace(/\/{2,}/g, '/') // Replace multiple slashes
      .replace(/\\\\/g, '\\') // Replace multiple backslashes
      .trim();
  }

  /**
   * Validate array length
   */
  public static validateArrayLength(
    array: any[],
    fieldName: string,
    min: number = 0,
    max: number = Infinity
  ): void {
    if (!Array.isArray(array)) {
      throw new ValidationError(fieldName, array, `${fieldName} must be an array`);
    }

    if (array.length < min) {
      throw new ValidationError(fieldName, array, `${fieldName} must have at least ${min} items`);
    }

    if (array.length > max) {
      throw new ValidationError(fieldName, array, `${fieldName} must have at most ${max} items`);
    }
  }

  /**
   * Validate string length
   */
  public static validateStringLength(
    value: string,
    fieldName: string,
    min: number = 0,
    max: number = Infinity
  ): void {
    if (typeof value !== 'string') {
      throw new ValidationError(fieldName, value, `${fieldName} must be a string`);
    }

    if (value.length < min) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at least ${min} characters`);
    }

    if (value.length > max) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at most ${max} characters`);
    }
  }

  /**
   * Validate a string with constraints on type, length, and field name
   */
  public static validateString(
    value: string,
    fieldName: string,
    minLength: number = 0,
    maxLength: number = Infinity
  ): void {
    if (typeof value !== 'string') {
      throw new ValidationError(fieldName, value, `${fieldName} must be a string`);
    }

    if (value.length < minLength) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at least ${minLength} characters`);
    }

    if (value.length > maxLength) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at most ${maxLength} characters`);
    }
  }

  /**
   * Validate number range
   */
  public static validateNumberRange(
    value: number,
    fieldName: string,
    min: number = -Infinity,
    max: number = Infinity
  ): void {
    if (typeof value !== 'number') {
      throw new ValidationError(fieldName, value, `${fieldName} must be a number`);
    }

    if (value < min) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at least ${min}`);
    }

    if (value > max) {
      throw new ValidationError(fieldName, value, `${fieldName} must be at most ${max}`);
    }
  }

  /**
   * Validate date range
   */
  public static validateDateRange(
    value: Date,
    fieldName: string,
    min?: Date,
    max?: Date
  ): void {
    if (!(value instanceof Date)) {
      throw new ValidationError(fieldName, value, `${fieldName} must be a Date object`);
    }

    if (min && value < min) {
      throw new ValidationError(fieldName, value, `${fieldName} must be after ${min.toISOString()}`);
    }

    if (max && value > max) {
      throw new ValidationError(fieldName, value, `${fieldName} must be before ${max.toISOString()}`);
    }
  }

  /**
   * Validate enum value
   */
  public static validateEnum<T>(
    value: T,
    fieldName: string,
    enumObject: object
  ): void {
    if (!Object.values(enumObject).includes(value)) {
      throw new ValidationError(
        fieldName,
        value,
        `${fieldName} must be one of: ${Object.values(enumObject).join(', ')}`
      );
    }
  }

  /**
   * Type guard for checking if value is defined
   */
  public static isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
  }

  /**
   * Type guard for checking if value is a string
   */
  public static isString(value: any): value is string {
    return typeof value === 'string';
  }

  /**
   * Type guard for checking if value is a number
   */
  public static isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * Type guard for checking if value is a boolean
   */
  public static isBoolean(value: any): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Type guard for checking if value is an array
   */
  public static isArray<T>(value: any): value is T[] {
    return Array.isArray(value);
  }

  /**
   * Type guard for checking if value is an object
   */
  public static isObject(value: any): value is object {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Type guard for checking if value is a Date
   */
  public static isDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }
}