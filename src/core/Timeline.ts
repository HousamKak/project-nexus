// src/core/Timeline.ts

import { Activity, ActivityType, ImportanceLevel, TimeUnit } from '../types/activity';
import { Theme } from '../types/theme';
import { AnimationManager } from '../utils/animations';
import { ValidationError } from '../utils/errors';
import { Validator } from '../utils/validation';

/**
 * Timeline visualization component
 * Displays activities in a chronological view
 */
export class Timeline {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activities: Activity[];
  private theme: Theme;
  private animationManager: AnimationManager;
  
  private viewport: Viewport;
  private mouse: MouseState;
  private hoveredActivity: string | null = null;
  private selectedActivities: Set<string> = new Set();
  
  private scale: TimelineScale;
  private filters: TimelineFilter;
  private heatmap: Map<string, number>;
  
  private readonly ACTIVITY_HEIGHT = 40;
  private readonly ACTIVITY_MARGIN = 10;
  private readonly TIMELINE_PADDING = 60;
  private readonly HEADER_HEIGHT = 80;

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    if (!canvas) {
      throw new ValidationError('canvas', canvas, 'Canvas element is required');
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new ValidationError('canvas', canvas, 'Failed to get 2D context');
    }
    
    this.canvas = canvas;
    this.ctx = context;
    this.activities = [];
    this.theme = theme;
    this.animationManager = new AnimationManager();
    
    this.viewport = {
      startTime: this.getStartOfDay(new Date()),
      endTime: this.getEndOfDay(new Date()),
      offsetX: 0,
      offsetY: 0,
      zoom: 1
    };
    
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      dragging: false,
      startX: 0,
      startY: 0
    };
    
    this.scale = {
      unit: TimeUnit.DAY,
      pixelsPerUnit: 100,
      labelFormat: 'MMM DD'
    };
    
    this.filters = {
      types: [],
      importance: [],
      projectIds: []
    };
    
    this.heatmap = new Map();
    
    this.setupEventListeners();
    this.startRenderLoop();
  }

  /**
   * Set activities to display
   */
  public setActivities(activities: Activity[]): void {
    this.activities = activities.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    this.calculateHeatmap();
    this.adjustViewport();
  }

  /**
   * Add activities to the timeline
   */
  public addActivities(activities: Activity[]): void {
    activities.forEach(activity => {
      if (!activity || !activity.id) {
        throw new ValidationError('activity', activity, 'Invalid activity: missing id');
      }
      
      Validator.validateActivity(activity);
      this.activities.push(activity);
    });
    
    // Resort activities
    this.activities.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    this.calculateHeatmap();
    
    // Animate additions
    activities.forEach(activity => {
      this.animationManager.animate(`add-${activity.id}`, {
        from: { opacity: 0, scale: 0 },
        to: { opacity: 1, scale: 1 },
        duration: 800,
        easing: 'easeOutElastic'
      });
    });
  }

  /**
   * Remove activities from the timeline
   */
  public removeActivities(activityIds: string[]): void {
    activityIds.forEach(id => {
      this.animationManager.animate(`remove-${id}`, {
        from: { opacity: 1, scale: 1 },
        to: { opacity: 0, scale: 0 },
        duration: 500,
        easing: 'easeInBack',
        onComplete: () => {
          this.activities = this.activities.filter(a => a.id !== id);
          this.calculateHeatmap();
        }
      });
    });
  }

  /**
   * Set time scale
   */
  public setScale(unit: TimeUnit): void {
    this.scale.unit = unit;
    
    switch (unit) {
      case TimeUnit.HOUR:
        this.scale.pixelsPerUnit = 60;
        this.scale.labelFormat = 'HH:mm';
        break;
      case TimeUnit.DAY:
        this.scale.pixelsPerUnit = 100;
        this.scale.labelFormat = 'MMM DD';
        break;
      case TimeUnit.WEEK:
        this.scale.pixelsPerUnit = 140;
        this.scale.labelFormat = 'Week W';
        break;
      case TimeUnit.MONTH:
        this.scale.pixelsPerUnit = 120;
        this.scale.labelFormat = 'MMMM YYYY';
        break;
      case TimeUnit.YEAR:
        this.scale.pixelsPerUnit = 100;
        this.scale.labelFormat = 'YYYY';
        break;
    }
    
    this.calculateHeatmap();
  }

  /**
   * Set filters
   */
  public setFilters(filters: TimelineFilter): void {
    this.filters = { ...filters };
    this.calculateHeatmap();
  }

  /**
   * Focus on a specific time range
   */
  public focusTimeRange(startTime: Date, endTime: Date, animated: boolean = true): void {
    if (startTime >= endTime) {
      throw new ValidationError('startTime', startTime, 'Start time must be before end time');
    }
    
    const targetViewport = {
      startTime,
      endTime,
      offsetX: 0,
      offsetY: 0,
      zoom: this.calculateZoomForRange(startTime, endTime)
    };
    
    if (animated) {
      this.animationManager.animate('viewportChange', {
        from: this.viewport,
        to: targetViewport,
        duration: 800,
        easing: 'easeInOutCubic',
        onUpdate: (value: Viewport) => {
          this.viewport = value;
        }
      });
    } else {
      this.viewport = targetViewport;
    }
  }

  /**
   * Set the active theme
   */
  public setTheme(theme: Theme): void {
    if (!theme) {
      throw new ValidationError('theme', theme, 'Theme is required');
    }
    
    this.theme = theme;
  }

  /**
   * Main render loop
   */
  private render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    this.ctx.fillStyle = this.theme.colors.backgroundPrimary;
    this.ctx.fillRect(0, 0, width, height);
    
    // Apply viewport transform
    this.ctx.save();
    this.ctx.translate(this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    
    // Render layers
    this.renderGrid();
    this.renderActivities();
    this.renderConnections();
    
    this.ctx.restore();
    
    // Render UI overlay
    this.renderHeader();
    this.renderTooltip();
  }

  /**
   * Render timeline grid
   */
  private renderGrid(): void {
    const unit = this.getGridUnit();
    const interval = this.getUnitDuration(unit);
    
    // Start from aligned time
    let currentTime = this.alignToUnit(this.viewport.startTime, unit);
    
    this.ctx.strokeStyle = this.theme.colors.textTertiary;
    this.ctx.lineWidth = 1;
    this.ctx.font = `${this.theme.typography.fontSize.xs} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.fillStyle = this.theme.colors.textSecondary;
    this.ctx.textAlign = 'center';
    
    while (currentTime.getTime() <= this.viewport.endTime.getTime()) {
      const x = this.timeToX(currentTime);
      
      // Draw vertical line
      this.ctx.globalAlpha = 0.2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.HEADER_HEIGHT);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
      
      // Draw label
      this.ctx.globalAlpha = 1;
      const label = this.formatTimeLabel(currentTime, unit);
      this.ctx.fillText(label, x, this.HEADER_HEIGHT - 10);
      
      // Move to next interval
      currentTime = new Date(currentTime.getTime() + interval);
    }
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render activities
   */
  private renderActivities(): void {
    const visibleActivities = this.getVisibleActivities();
    let currentY = this.HEADER_HEIGHT + this.TIMELINE_PADDING;
    
    // Group activities by type for better organization
    const groupedActivities = this.groupActivitiesByType(visibleActivities);
    
    Object.entries(groupedActivities).forEach(([type, activities]) => {
      // Render type header
      this.renderTypeHeader(type as ActivityType, currentY);
      currentY += 30;
      
      // Render activities
      activities.forEach(activity => {
        this.renderActivity(activity, currentY);
        currentY += this.ACTIVITY_HEIGHT + this.ACTIVITY_MARGIN;
      });
      
      currentY += 20; // Extra space between types
    });
  }

  /**
   * Render single activity
   */
  private renderActivity(activity: Activity, y: number): void {
    const x = this.timeToX(activity.timestamp);
    const width = this.getActivityWidth(activity);
    const height = this.ACTIVITY_HEIGHT;
    
    // Get animation state
    const animState = this.animationManager.animations.get(`add-${activity.id}`) || 
                     this.animationManager.animations.get(`remove-${activity.id}`);
    
    let opacity = 1;
    let scale = 1;
    
    if (animState) {
      const progress = animState.getProgress();
      opacity = progress.opacity || 1;
      scale = progress.scale || 1;
    }
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(x + width / 2, y + height / 2);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-x - width / 2, -y - height / 2);
    
    // Activity background
    const color = this.getActivityColor(activity);
    this.ctx.fillStyle = color + '20';
    this.ctx.fillRect(x, y, width, height);
    
    // Activity border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Importance indicator
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 4, height);
    
    // Activity content
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    const title = this.truncateText(activity.data.title, width - 20);
    this.ctx.fillText(title, x + 12, y + height / 2);
    
    // Hover effect
    if (this.hoveredActivity === activity.id) {
      this.ctx.strokeStyle = this.theme.colors.accentPrimary;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    }
    
    // Selection effect
    if (this.selectedActivities.has(activity.id)) {
      this.ctx.fillStyle = this.theme.colors.accentPrimary + '20';
      this.ctx.fillRect(x, y, width, height);
    }
    
    this.ctx.restore();
  }

  /**
   * Render connections between related activities
   */
  private renderConnections(): void {
    // Find related activities
    const connections = this.findActivityConnections();
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.ctx.strokeStyle = this.theme.colors.textTertiary;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    
    connections.forEach(({ from, to }) => {
      const fromPos = this.getActivityPosition(from);
      const toPos = this.getActivityPosition(to);
      
      if (fromPos && toPos) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromPos.x + fromPos.width, fromPos.y + fromPos.height / 2);
        this.ctx.lineTo(toPos.x, toPos.y + toPos.height / 2);
        this.ctx.stroke();
      }
    });
    
    this.ctx.restore();
  }

  /**
   * Render timeline header
   */
  private renderHeader(): void {
    // Background
    this.ctx.fillStyle = this.theme.colors.backgroundSecondary;
    this.ctx.fillRect(0, 0, this.canvas.width, this.HEADER_HEIGHT);
    
    // Border
    this.ctx.strokeStyle = this.theme.colors.textTertiary;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.HEADER_HEIGHT);
    this.ctx.lineTo(this.canvas.width, this.HEADER_HEIGHT);
    this.ctx.stroke();
    
    // Current time range
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.font = `${this.theme.typography.fontSize.md} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'center';
    
    const rangeText = `${this.formatDate(this.viewport.startTime)} - ${this.formatDate(this.viewport.endTime)}`;
    this.ctx.fillText(rangeText, this.canvas.width / 2, 30);
    
    // Statistics
    this.renderStatistics();
  }

  /**
   * Render timeline statistics
   */
  private renderStatistics(): void {
    const stats = this.calculateStatistics();
    
    this.ctx.fillStyle = this.theme.colors.textSecondary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    
    const statTexts = [
      `Activities: ${stats.totalActivities}`,
      `Commits: ${stats.commits}`,
      `Files Changed: ${stats.filesChanged}`,
      `Active Days: ${stats.activeDays}`
    ];
    
    statTexts.forEach((text, index) => {
      this.ctx.fillText(text, 20 + index * 150, 55);
    });
  }

  /**
   * Render tooltip
   */
  private renderTooltip(): void {
    if (!this.hoveredActivity) return;
    
    const activity = this.activities.find(a => a.id === this.hoveredActivity);
    if (!activity) return;
    
    const pos = this.getActivityPosition(activity);
    if (!pos) return;
    
    const padding = 10;
    const lineHeight = 20;
    const lines = [
      activity.data.title,
      `Type: ${activity.type}`,
      `Time: ${this.formatDateTime(activity.timestamp)}`,
      `Importance: ${this.getImportanceLabel(activity.importance)}`
    ];
    
    if (activity.data.description) {
      lines.push('', activity.data.description);
    }
    
    const maxWidth = Math.max(...lines.map(line => 
      this.ctx.measureText(line).width
    ));
    
    const width = maxWidth + padding * 2;
    const height = lines.length * lineHeight + padding * 2;
    
    let x = pos.x * this.viewport.zoom + this.viewport.offsetX;
    let y = pos.y * this.viewport.zoom + this.viewport.offsetY - height - 10;
    
    // Keep tooltip on screen
    if (x + width > this.canvas.width) {
      x = this.canvas.width - width - 10;
    }
    
    if (y < 0) {
      y = pos.y * this.viewport.zoom + this.viewport.offsetY + pos.height + 10;
    }
    
    // Background
    this.ctx.fillStyle = this.theme.colors.backgroundSecondary + 'EE';
    this.ctx.fillRect(x, y, width, height);
    
    // Border
    this.ctx.strokeStyle = this.getActivityColor(activity);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Content
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, x + padding, y + padding + (index + 1) * lineHeight - 4);
    });
  }

  /**
   * Calculate activity heatmap
   */
  private calculateHeatmap(): void {
    this.heatmap.clear();
    
    this.activities.forEach(activity => {
      const dateKey = this.getDateKey(activity.timestamp);
      const current = this.heatmap.get(dateKey) || 0;
      this.heatmap.set(dateKey, current + 1);
    });
  }

  /**
   * Get visible activities
   */
  private getVisibleActivities(): Activity[] {
    return this.activities.filter(activity => {
      // Time range filter
      if (activity.timestamp < this.viewport.startTime || 
          activity.timestamp > this.viewport.endTime) {
        return false;
      }
      
      // Type filter
      if (this.filters.types.length > 0 && 
          !this.filters.types.includes(activity.type)) {
        return false;
      }
      
      // Importance filter
      if (this.filters.importance.length > 0 && 
          !this.filters.importance.includes(activity.importance)) {
        return false;
      }
      
      // Project filter
      if (this.filters.projectIds.length > 0 && 
          !this.filters.projectIds.includes(activity.projectId)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Group activities by type
   */
  private groupActivitiesByType(activities: Activity[]): Record<string, Activity[]> {
    const grouped: Record<string, Activity[]> = {};
    
    activities.forEach(activity => {
      if (!grouped[activity.type]) {
        grouped[activity.type] = [];
      }
      grouped[activity.type].push(activity);
    });
    
    return grouped;
  }

  /**
   * Render type header
   */
  private renderTypeHeader(type: ActivityType, y: number): void {
    this.ctx.fillStyle = this.theme.colors.textSecondary;
    this.ctx.font = `bold ${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    
    const label = this.getActivityTypeLabel(type);
    const color = this.getActivityTypeColor(type);
    
    // Type icon
    this.ctx.fillStyle = color;
    this.ctx.fillRect(20, y + 5, 20, 20);
    
    // Type label
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.fillText(label, 50, y + 18);
  }

  /**
   * Get activity color based on type
   */
  private getActivityColor(activity: Activity): string {
    return this.getActivityTypeColor(activity.type);
  }

  /**
   * Get activity type color
   */
  private getActivityTypeColor(type: ActivityType): string {
    const colors: Record<ActivityType, string> = {
      [ActivityType.COMMIT]: this.theme.colors.success,
      [ActivityType.FILE_CHANGE]: this.theme.colors.info,
      [ActivityType.DOCUMENTATION]: this.theme.colors.warning,
      [ActivityType.MILESTONE]: this.theme.colors.accentPrimary,
      [ActivityType.TASK_UPDATE]: this.theme.colors.textSecondary,
      [ActivityType.BUILD]: this.theme.colors.info,
      [ActivityType.DEPLOYMENT]: this.theme.colors.success,
      [ActivityType.ERROR]: this.theme.colors.error,
      [ActivityType.REVIEW]: this.theme.colors.accentSecondary
    };
    
    return colors[type] || this.theme.colors.textPrimary;
  }

  /**
   * Get activity type label
   */
  private getActivityTypeLabel(type: ActivityType): string {
    const labels: Record<ActivityType, string> = {
      [ActivityType.COMMIT]: 'Commits',
      [ActivityType.FILE_CHANGE]: 'File Changes',
      [ActivityType.DOCUMENTATION]: 'Documentation',
      [ActivityType.MILESTONE]: 'Milestones',
      [ActivityType.TASK_UPDATE]: 'Task Updates',
      [ActivityType.BUILD]: 'Builds',
      [ActivityType.DEPLOYMENT]: 'Deployments',
      [ActivityType.ERROR]: 'Errors',
      [ActivityType.REVIEW]: 'Reviews'
    };
    
    return labels[type] || type;
  }

  /**
   * Get importance label
   */
  private getImportanceLabel(importance: ImportanceLevel): string {
    const labels = ['Low', 'Medium', 'High', 'Critical'];
    return labels[importance - 1] || 'Unknown';
  }

  /**
   * Convert time to X coordinate
   */
  private timeToX(time: Date): number {
    const timeDiff = time.getTime() - this.viewport.startTime.getTime();
    const totalDiff = this.viewport.endTime.getTime() - this.viewport.startTime.getTime();
    const ratio = timeDiff / totalDiff;
    
    return this.TIMELINE_PADDING + ratio * (this.canvas.width - 2 * this.TIMELINE_PADDING);
  }

  /**
   * Convert X coordinate to time
   */
  private xToTime(x: number): Date {
    const adjustedX = x - this.TIMELINE_PADDING;
    const width = this.canvas.width - 2 * this.TIMELINE_PADDING;
    const ratio = adjustedX / width;
    
    const totalDiff = this.viewport.endTime.getTime() - this.viewport.startTime.getTime();
    const timeDiff = ratio * totalDiff;
    
    return new Date(this.viewport.startTime.getTime() + timeDiff);
  }

  /**
   * Get activity width
   */
  private getActivityWidth(activity: Activity): number {
    // Base width on importance
    const baseWidth = 150;
    const importanceMultiplier = 1 + (activity.importance - 1) * 0.2;
    
    return baseWidth * importanceMultiplier;
  }

  /**
   * Get activity position
   */
  private getActivityPosition(activity: Activity): { x: number, y: number, width: number, height: number } | null {
    const index = this.activities.indexOf(activity);
    if (index === -1) return null;
    
    const x = this.timeToX(activity.timestamp);
    const y = this.HEADER_HEIGHT + this.TIMELINE_PADDING + 
              index * (this.ACTIVITY_HEIGHT + this.ACTIVITY_MARGIN);
    const width = this.getActivityWidth(activity);
    const height = this.ACTIVITY_HEIGHT;
    
    return { x, y, width, height };
  }

  /**
   * Find connections between activities
   */
  private findActivityConnections(): Array<{ from: Activity, to: Activity }> {
    const connections: Array<{ from: Activity, to: Activity }> = [];
    const commitActivities = this.activities.filter(a => a.type === ActivityType.COMMIT);
    
    for (let i = 0; i < commitActivities.length - 1; i++) {
      const current = commitActivities[i];
      const next = commitActivities[i + 1];
      
      if (!current || !next) continue;
      
      if (current.data.metadata?.['files'] && next.data.metadata?.['files']) {
        const currentFiles = new Set(current.data.metadata['files'] as string[]);
        const nextFiles = new Set(next.data.metadata['files'] as string[]);
        
        const hasOverlap = Array.from(currentFiles).some(file => nextFiles.has(file));
        
        if (hasOverlap) {
          connections.push({ from: current, to: next });
        }
      }
    }
    
    return connections;
  }

  /**
   * Calculate timeline statistics
   */
  private calculateStatistics(): TimelineStats {
    const visibleActivities = this.getVisibleActivities();
    
    const stats: TimelineStats = {
      totalActivities: visibleActivities.length,
      commits: 0,
      filesChanged: 0,
      activeDays: 0
    };
    
    const activeDays = new Set<string>();
    const changedFiles = new Set<string>();
    
    visibleActivities.forEach(activity => {
      if (activity.type === ActivityType.COMMIT) {
        stats.commits++;
      }
      
      if (activity.data.metadata?.['files']) {
        const files = activity.data.metadata['files'] as string[];
        files.forEach((file: string) => {
          changedFiles.add(file);
        });
      }
      
      activeDays.add(this.getDateKey(activity.timestamp));
    });
    
    stats.filesChanged = changedFiles.size;
    stats.activeDays = activeDays.size;
    
    return stats;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Resize events
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    this.mouse.down = true;
    this.mouse.startX = event.clientX;
    this.mouse.startY = event.clientY;
    
    // Check for activity click
    const activity = this.getActivityAtPosition(event.clientX, event.clientY);
    if (activity) {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        if (this.selectedActivities.has(activity.id)) {
          this.selectedActivities.delete(activity.id);
        } else {
          this.selectedActivities.add(activity.id);
        }
      } else {
        // Single select
        this.selectedActivities.clear();
        this.selectedActivities.add(activity.id);
      }
      
      this.dispatchEvent('activitySelected', { activities: Array.from(this.selectedActivities) });
    } else {
      // Clear selection if clicking empty space
      if (!(event.ctrlKey || event.metaKey)) {
        this.selectedActivities.clear();
        this.dispatchEvent('activitySelected', { activities: [] });
      }
    }
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    
    if (this.mouse.down) {
      // Pan timeline
      const dx = event.clientX - this.mouse.startX;
      const dy = event.clientY - this.mouse.startY;
      
      this.viewport.offsetX += dx;
      this.viewport.offsetY += dy;
      
      this.mouse.startX = event.clientX;
      this.mouse.startY = event.clientY;
      this.mouse.dragging = true;
    } else {
      // Check for hover
      const activity = this.getActivityAtPosition(event.clientX, event.clientY);
      this.hoveredActivity = activity ? activity.id : null;
      
      this.canvas.style.cursor = activity ? 'pointer' : 'default';
    }
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    this.mouse.down = false;
    this.mouse.dragging = false;
  }

  /**
   * Handle wheel event for zoom
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.viewport.zoom * zoomDelta;
    
    if (newZoom >= 0.1 && newZoom <= 5) {
      // Zoom towards mouse position
      const mouseTime = this.xToTime(event.clientX);
      
      this.viewport.zoom = newZoom;
      
      // Adjust time range to maintain mouse position
      const newMouseTime = this.xToTime(event.clientX);
      const timeDiff = newMouseTime.getTime() - mouseTime.getTime();
      
      this.viewport.startTime = new Date(this.viewport.startTime.getTime() - timeDiff);
      this.viewport.endTime = new Date(this.viewport.endTime.getTime() - timeDiff);
    }
  }

  /**
   * Handle double click event
   */
  private handleDoubleClick(event: MouseEvent): void {
    const activity = this.getActivityAtPosition(event.clientX, event.clientY);
    if (activity) {
      this.dispatchEvent('activityOpen', { activity });
    }
  }

  /**
   * Get activity at screen position
   */
  private getActivityAtPosition(x: number, y: number): Activity | null {
    const adjustedX = (x - this.viewport.offsetX) / this.viewport.zoom;
    const adjustedY = (y - this.viewport.offsetY) / this.viewport.zoom;
    
    for (const activity of this.activities) {
      const pos = this.getActivityPosition(activity);
      if (!pos) continue;
      
      if (adjustedX >= pos.x && adjustedX <= pos.x + pos.width &&
          adjustedY >= pos.y && adjustedY <= pos.y + pos.height) {
        return activity;
      }
    }
    
    return null;
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const animate = () => {
      this.render();
      this.animationManager.update();
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Adjust viewport to fit activities
   */
  private adjustViewport(): void {
    if (this.activities.length === 0) return;
    
    const firstActivity = this.activities[0];
    const lastActivity = this.activities[this.activities.length - 1];
    
    if (!firstActivity || !lastActivity) return;
    
    const padding = 24 * 60 * 60 * 1000; // 1 day padding
    
    this.viewport.startTime = new Date(firstActivity.timestamp.getTime() - padding);
    this.viewport.endTime = new Date(lastActivity.timestamp.getTime() + padding);
  }

  /**
   * Calculate zoom level for time range
   */
  private calculateZoomForRange(startTime: Date, endTime: Date): number {
    const rangeDuration = endTime.getTime() - startTime.getTime();
    const viewportDuration = this.viewport.endTime.getTime() - this.viewport.startTime.getTime();
    
    return Math.min(5, Math.max(0.1, viewportDuration / rangeDuration));
  }

  /**
   * Get grid unit based on zoom level
   */
  private getGridUnit(): TimeUnit {
    const hoursVisible = (this.viewport.endTime.getTime() - this.viewport.startTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursVisible < 12) return TimeUnit.HOUR;
    if (hoursVisible < 168) return TimeUnit.DAY; // 1 week
    if (hoursVisible < 720) return TimeUnit.WEEK; // 1 month
    if (hoursVisible < 8760) return TimeUnit.MONTH; // 1 year
    return TimeUnit.YEAR;
  }

  /**
   * Get duration of a time unit in milliseconds
   */
  private getUnitDuration(unit: TimeUnit): number {
    switch (unit) {
      case TimeUnit.HOUR: return 60 * 60 * 1000;
      case TimeUnit.DAY: return 24 * 60 * 60 * 1000;
      case TimeUnit.WEEK: return 7 * 24 * 60 * 60 * 1000;
      case TimeUnit.MONTH: return 30 * 24 * 60 * 60 * 1000; // Approximate
      case TimeUnit.YEAR: return 365 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Align date to time unit
   */
  private alignToUnit(date: Date, unit: TimeUnit): Date {
    const aligned = new Date(date);
    
    switch (unit) {
      case TimeUnit.HOUR:
        aligned.setMinutes(0, 0, 0);
        break;
      case TimeUnit.DAY:
        aligned.setHours(0, 0, 0, 0);
        break;
      case TimeUnit.WEEK:
        aligned.setHours(0, 0, 0, 0);
        aligned.setDate(aligned.getDate() - aligned.getDay());
        break;
      case TimeUnit.MONTH:
        aligned.setHours(0, 0, 0, 0);
        aligned.setDate(1);
        break;
      case TimeUnit.YEAR:
        aligned.setHours(0, 0, 0, 0);
        aligned.setMonth(0, 1);
        break;
    }
    
    return aligned;
  }

  /**
   * Format time label based on unit
   */
  private formatTimeLabel(date: Date, unit: TimeUnit): string {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (unit) {
      case TimeUnit.HOUR:
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case TimeUnit.DAY:
        options.month = 'short';
        options.day = 'numeric';
        break;
      case TimeUnit.WEEK:
        return `Week ${this.getWeekNumber(date)}`;
      case TimeUnit.MONTH:
        options.month = 'long';
        options.year = 'numeric';
        break;
      case TimeUnit.YEAR:
        options.year = 'numeric';
        break;
    }
    
    return date.toLocaleDateString(undefined, options);
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format date and time for display
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get date key for heatmap
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get start of day
   */
  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get end of day
   */
  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Truncate text to fit width
   */
  private truncateText(text: string, maxWidth: number): string {
    const metrics = this.ctx.measureText(text);
    
    if (metrics.width <= maxWidth) {
      return text;
    }
    
    let truncated = text;
    while (truncated.length > 0 && this.ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    
    return truncated + '...';
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.selectedActivities.clear();
        this.dispatchEvent('activitySelected', { activities: [] });
        break;
      
      case 'Delete':
        if (this.selectedActivities.size > 0) {
          this.dispatchEvent('deleteActivities', { 
            activityIds: Array.from(this.selectedActivities) 
          });
        }
        break;
      
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Select all visible activities
          const visible = this.getVisibleActivities();
          visible.forEach(activity => {
            this.selectedActivities.add(activity.id);
          });
          this.dispatchEvent('activitySelected', { 
            activities: Array.from(this.selectedActivities) 
          });
        }
        break;
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (touch) {
        this.handleMouseDown({
          clientX: touch.clientX,
          clientY: touch.clientY
        } as MouseEvent);
      }
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (touch) {
        this.handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY
        } as MouseEvent);
      }
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.handleMouseUp({} as MouseEvent);
    }
  }

  /**
   * Dispatch custom events
   */
  private dispatchEvent(name: string, detail: any): void {
    this.canvas.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.animationManager.destroy();
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Supporting interfaces
interface Viewport {
  startTime: Date;
  endTime: Date;
  offsetX: number;
  offsetY: number;
  zoom: number;
}

interface MouseState {
  x: number;
  y: number;
  down: boolean;
  dragging: boolean;
  startX: number;
  startY: number;
}

interface TimelineScale {
  unit: TimeUnit;
  pixelsPerUnit: number;
  labelFormat: string;
}

interface TimelineFilter {
  types: ActivityType[];
  importance: ImportanceLevel[];
  projectIds: string[];
}

interface TimelineStats {
  totalActivities: number;
  commits: number;
  filesChanged: number;
  activeDays: number;
}