// src/core/GalaxyView.ts

import { Project, ProjectPosition, OrbitalRing, PlanetSize } from '../types/project';
import { Theme } from '../types/theme';
import { ValidationError } from '../utils/errors';
import { AnimationManager } from '../utils/animations';

/**
 * Main galaxy visualization component
 * Renders projects as planets in an interactive solar system
 */
export class GalaxyView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private projects: Map<string, Project>;
  private theme: Theme;
  private animationManager: AnimationManager;

  private camera: Camera;
  private mouse: MouseState;
  private hoveredProject: string | null;

  private stars: Star[];
  private nebulae: Nebula[];

  private readonly MIN_ZOOM = 0.1;
  private readonly MAX_ZOOM = 5.0;
  private readonly ORBIT_SPEEDS = {
    [OrbitalRing.ACTIVE]: 0.02,
    [OrbitalRing.ONGOING]: 0.01,
    [OrbitalRing.ARCHIVED]: 0.005
  };

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    if (!canvas) {
      throw new ValidationError('canvas', canvas, 'Canvas element is required');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new ValidationError('canvas', canvas, 'Failed to get 2D context');
    }

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    this.canvas = canvas;
    this.ctx = context;
    this.projects = new Map();
    this.theme = theme;
    this.animationManager = new AnimationManager();

    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0
    };

    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      dragging: false,
      startX: 0,
      startY: 0
    };

    this.hoveredProject = null;

    this.stars = this.generateStarfield(500);
    this.nebulae = this.generateNebulae(3);

    this.setupEventListeners();
    this.startRenderLoop();
  }

  /**
   * Add a project to the galaxy
   */
  public addProject(project: Project): void {
    if (!project || !project.id) {
      throw new ValidationError('project', project, 'Invalid project: missing id');
    }

    if (this.projects.has(project.id)) {
      throw new ValidationError('project.id', project.id, 'Project already exists');
    }

    // Validate project data
    this.validateProject(project);

    // Calculate initial position if not provided
    if (!project.position) {
      project.position = this.calculateOrbitPosition(project);
    }

    this.projects.set(project.id, project);

    // Animate the addition
    this.animationManager.animate('addProject', {
      id: project.id,
      duration: 1000,
      easing: 'easeOutElastic'
    });
  }

  /**
   * Remove a project from the galaxy
   */
  public removeProject(projectId: string): void {
    if (!this.projects.has(projectId)) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }

    // Animate the removal
    this.animationManager.animate('removeProject', {
      id: projectId,
      duration: 500,
      easing: 'easeInBack',
      onComplete: () => {
        this.projects.delete(projectId);
      }
    });
  }

  /**
   * Update a project's properties
   */
  public updateProject(projectId: string, updates: Partial<Project>): void {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }

    // Validate updates
    if (updates.position) {
      this.validatePosition(updates.position);
    }

    // Apply updates
    Object.assign(project, updates);
    project.lastModified = new Date();
  }

  /**
   * Set the active theme
   */
  public setTheme(theme: Theme): void {
    if (!theme) {
      throw new ValidationError('theme', theme, 'Theme is required');
    }

    this.theme = theme;
    this.regenerateStarfield();
  }

  /**
   * Get current camera position
   */
  public getCameraState(): Camera {
    return { ...this.camera };
  }

  /**
   * Set camera position
   */
  public setCameraState(camera: Partial<Camera>): void {
    if (camera.zoom !== undefined) {
      this.camera.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, camera.zoom));
    }

    if (camera.x !== undefined) {
      this.camera.x = camera.x;
    }

    if (camera.y !== undefined) {
      this.camera.y = camera.y;
    }

    if (camera.rotation !== undefined) {
      this.camera.rotation = camera.rotation;
    }
  }

  /**
   * Focus camera on a specific project
   */
  public focusProject(projectId: string, animated: boolean = true): void {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new ValidationError('projectId', projectId, 'Project not found');
    }

    const position = this.calculateProjectScreenPosition(project);

    if (animated) {
      this.animationManager.animate('cameraMove', {
        from: this.camera,
        to: {
          x: position.x,
          y: position.y,
          zoom: 2
        },
        duration: 800,
        easing: 'easeInOutCubic',
        onUpdate: (value: Camera) => {
          this.camera = value;
        }
      });
    } else {
      this.camera.x = position.x;
      this.camera.y = position.y;
      this.camera.zoom = 2;
    }
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

    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.rotate(this.camera.rotation);
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Render layers
    this.renderStarfield();
    this.renderNebulae();
    this.renderOrbits();
    this.renderProjects();
    this.renderConnections();

    this.ctx.restore();

    // Render UI overlay
    this.renderUI();
  }

  /**
   * Render background starfield
   */
  private renderStarfield(): void {
    this.ctx.fillStyle = this.theme.colors.starfield;

    for (const star of this.stars) {
      const parallax = 1 + (star.z * 0.5);
      const x = star.x / parallax;
      const y = star.y / parallax;
      const size = star.size / parallax;

      this.ctx.globalAlpha = star.brightness;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render background nebulae
   */
  private renderNebulae(): void {
    for (const nebula of this.nebulae) {
      const gradient = this.ctx.createRadialGradient(
        nebula.x,
        nebula.y,
        0,
        nebula.x,
        nebula.y,
        nebula.radius
      );

      gradient.addColorStop(0, nebula.color + '40');
      gradient.addColorStop(0.5, nebula.color + '20');
      gradient.addColorStop(1, nebula.color + '00');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        nebula.x - nebula.radius,
        nebula.y - nebula.radius,
        nebula.radius * 2,
        nebula.radius * 2
      );
    }
  }

  /**
   * Render orbital rings
   */
  private renderOrbits(): void {
    const rings = [
      { ring: OrbitalRing.ACTIVE, radius: 200 },
      { ring: OrbitalRing.ONGOING, radius: 350 },
      { ring: OrbitalRing.ARCHIVED, radius: 500 }
    ];

    this.ctx.strokeStyle = this.theme.colors.orbitRing;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.3;

    for (const orbit of rings) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, orbit.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render all projects as planets
   */
  private renderProjects(): void {
    const time = Date.now() * 0.001;

    for (const [, project] of this.projects) {
      const position = this.calculateProjectPosition(project, time);
      const size = this.getProjectSize(project);

      // Planet body
      const gradient = this.ctx.createRadialGradient(
        position.x,
        position.y,
        0,
        position.x,
        position.y,
        size
      );

      gradient.addColorStop(0, project.theme.color + 'FF');
      gradient.addColorStop(0.7, project.theme.color + 'CC');
      gradient.addColorStop(1, project.theme.color + '80');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow effect
      if (project.theme.glow || project.id === this.hoveredProject) {
        const glowGradient = this.ctx.createRadialGradient(
          position.x,
          position.y,
          size,
          position.x,
          position.y,
          size * 2
        );

        glowGradient.addColorStop(0, project.theme.color + '40');
        glowGradient.addColorStop(1, project.theme.color + '00');

        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Active indicator
      if (project.status === 'active') {
        this.ctx.strokeStyle = this.theme.colors.accentPrimary;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, size + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  /**
   * Render connections between related projects
   */
  private renderConnections(): void {
    this.ctx.strokeStyle = this.theme.colors.textTertiary;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;

    for (const [, project] of this.projects) {
      if (project.dependencies) {
        const fromPos = this.calculateProjectPosition(project, Date.now() * 0.001);

        for (const depId of project.dependencies) {
          const dep = this.projects.get(depId);
          if (dep) {
            const toPos = this.calculateProjectPosition(dep, Date.now() * 0.001);

            this.ctx.beginPath();
            this.ctx.moveTo(fromPos.x, fromPos.y);
            this.ctx.lineTo(toPos.x, toPos.y);
            this.ctx.stroke();
          }
        }
      }
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render UI overlay elements
   */
  private renderUI(): void {
    // Minimap
    this.renderMinimap();

    // Project tooltip
    if (this.hoveredProject) {
      this.renderTooltip(this.hoveredProject);
    }

    // Controls hint
    this.renderControlsHint();
  }

  /**
   * Calculate project position based on orbit
   */
  private calculateProjectPosition(project: Project, time: number): Point {
    const ringRadius = this.getRingRadius(project.position.ring);
    const angle = project.position.angle + (time * this.ORBIT_SPEEDS[project.position.ring]);

    return {
      x: Math.cos(angle) * ringRadius,
      y: Math.sin(angle) * ringRadius
    };
  }

  /**
   * Calculate project screen position
   */
  private calculateProjectScreenPosition(project: Project): Point {
    const pos = this.calculateProjectPosition(project, Date.now() * 0.001);
    return this.worldToScreen(pos);
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  private worldToScreen(point: Point): Point {
    return {
      x: (point.x - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
      y: (point.y - this.camera.y) * this.camera.zoom + this.canvas.height / 2
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(point: Point): Point {
    return {
      x: (point.x - this.canvas.width / 2) / this.camera.zoom + this.camera.x,
      y: (point.y - this.canvas.height / 2) / this.camera.zoom + this.camera.y
    };
  }

  /**
   * Get project size based on stats
   */
  private getProjectSize(project: Project): number {
    const baseSize = {
      [PlanetSize.SMALL]: 20,
      [PlanetSize.MEDIUM]: 30,
      [PlanetSize.LARGE]: 40
    };

    return baseSize[project.position.size] || 30;
  }

  /**
   * Get orbital ring radius
   */
  private getRingRadius(ring: OrbitalRing): number {
    const radii = {
      [OrbitalRing.ACTIVE]: 200,
      [OrbitalRing.ONGOING]: 350,
      [OrbitalRing.ARCHIVED]: 500
    };

    return radii[ring] || 350;
  }

  /**
   * Generate random starfield
   */
  private generateStarfield(count: number): Star[] {
    const stars: Star[] = [];
    const range = 2000;

    for (let i = 0; i < count; i++) {
      stars.push({
        x: (Math.random() - 0.5) * range,
        y: (Math.random() - 0.5) * range,
        z: Math.random() * 3,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2
      });
    }

    return stars;
  }

  /**
   * Generate random nebulae
   */
  private generateNebulae(count: number): Nebula[] {
    const nebulae: Nebula[] = [];
    const colors = this.theme.colors.nebula;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)] || '#FFFFFF';
      nebulae.push({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        radius: Math.random() * 200 + 100,
        color
      });
    }

    return nebulae;
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

    const worldPos = this.screenToWorld({
      x: event.clientX,
      y: event.clientY
    });

    // Check for project click
    const project = this.getProjectAtPosition(worldPos);
    if (project) {
      this.dispatchEvent('projectSelected', { project });
    }
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;

    if (this.mouse.down) {
      const dx = event.clientX - this.mouse.startX;
      const dy = event.clientY - this.mouse.startY;

      this.camera.x -= dx / this.camera.zoom;
      this.camera.y -= dy / this.camera.zoom;

      this.mouse.startX = event.clientX;
      this.mouse.startY = event.clientY;
      this.mouse.dragging = true;
    } else {
      // Check for hover
      const worldPos = this.screenToWorld({
        x: event.clientX,
        y: event.clientY
      });

      const project = this.getProjectAtPosition(worldPos);
      this.hoveredProject = project ? project.id : null;
    }
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(): void {
    this.mouse.down = false;
    this.mouse.dragging = false;
  }

  /**
   * Handle wheel event for zoom
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.camera.zoom * zoomDelta;

    if (newZoom >= this.MIN_ZOOM && newZoom <= this.MAX_ZOOM) {
      // Zoom towards mouse position
      const mouseWorld = this.screenToWorld({
        x: event.clientX,
        y: event.clientY
      });

      this.camera.zoom = newZoom;

      const mouseWorldAfter = this.screenToWorld({
        x: event.clientX,
        y: event.clientY
      });

      this.camera.x += mouseWorld.x - mouseWorldAfter.x;
      this.camera.y += mouseWorld.y - mouseWorldAfter.y;
    }
  }

  /**
   * Get project at world position
   */
  private getProjectAtPosition(position: Point): Project | null {
    const time = Date.now() * 0.001;

    for (const [, project] of this.projects) {
      const projectPos = this.calculateProjectPosition(project, time);
      const size = this.getProjectSize(project);

      const distance = Math.sqrt(
        Math.pow(position.x - projectPos.x, 2) +
        Math.pow(position.y - projectPos.y, 2)
      );

      if (distance <= size) {
        return project;
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
   * Dispatch custom events
   */
  private dispatchEvent(name: string, detail: any): void {
    this.canvas.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /**
   * Validate project data
   */
  private validateProject(project: Project): void {
    if (!project.name || project.name.trim().length === 0) {
      throw new ValidationError('project.name', project.name, 'Project name is required');
    }

    if (!project.path || project.path.trim().length === 0) {
      throw new ValidationError('project.path', project.path, 'Project path is required');
    }

    if (project.position) {
      this.validatePosition(project.position);
    }
  }

  /**
   * Validate position data
   */
  private validatePosition(position: ProjectPosition): void {
    if (!Object.values(OrbitalRing).includes(position.ring)) {
      throw new ValidationError('position.ring', position.ring, 'Invalid orbital ring');
    }

    if (position.angle < 0 || position.angle > 360) {
      throw new ValidationError('position.angle', position.angle, 'Angle must be between 0 and 360');
    }

    if (!Object.values(PlanetSize).includes(position.size)) {
      throw new ValidationError('position.size', position.size, 'Invalid planet size');
    }
  }

  /**
   * Calculate orbit position for a new project
   */
  private calculateOrbitPosition(project: Project): ProjectPosition {
    // Determine ring based on status
    let ring = OrbitalRing.ONGOING;
    if (project.status === 'active') {
      ring = OrbitalRing.ACTIVE;
    } else if (project.status === 'archived' || project.status === 'completed') {
      ring = OrbitalRing.ARCHIVED;
    }

    // Find an empty spot on the ring
    const angle = this.findEmptyAngle(ring);

    // Determine size based on project stats
    let size = PlanetSize.MEDIUM;
    if (project.stats.files < 20) {
      size = PlanetSize.SMALL;
    } else if (project.stats.files > 100) {
      size = PlanetSize.LARGE;
    }

    return {
      ring,
      angle,
      size,
      velocity: this.ORBIT_SPEEDS[ring]
    };
  }

  /**
   * Find an empty angle on an orbital ring
   */
  private findEmptyAngle(ring: OrbitalRing): number {
    const projectsOnRing = Array.from(this.projects.values())
      .filter(p => p.position.ring === ring)
      .map(p => p.position.angle)
      .sort((a, b) => a - b);

    if (projectsOnRing.length === 0) {
      return Math.random() * 360;
    }

    let largestGap = 0;
    let bestAngle = 0;

    for (let i = 0; i < projectsOnRing.length; i++) {
      const current = projectsOnRing[i];
      const next = projectsOnRing[(i + 1) % projectsOnRing.length];

      if (current !== undefined && next !== undefined) {
        const gap = (next - current + 360) % 360;

        if (gap > largestGap) {
          largestGap = gap;
          bestAngle = (current + gap / 2) % 360;
        }
      }
    }

    return bestAngle;
  }

  /**
   * Regenerate starfield with current theme
   */
  private regenerateStarfield(): void {
    this.stars = this.generateStarfield(500);
    this.nebulae = this.generateNebulae(3);
  }

  /**
   * Render minimap
   */
  private renderMinimap(): void {
    const minimapSize = 150;
    const margin = 20;
    const x = this.canvas.width - minimapSize - margin;
    const y = margin;

    // Background
    this.ctx.fillStyle = this.theme.colors.backgroundSecondary + 'CC';
    this.ctx.fillRect(x, y, minimapSize, minimapSize);

    // Border
    this.ctx.strokeStyle = this.theme.colors.textTertiary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, minimapSize, minimapSize);

    // Projects
    const scale = minimapSize / 1200; // Adjust based on galaxy size
    const center = minimapSize / 2;

    for (const [, project] of this.projects) {
      const pos = this.calculateProjectPosition(project, Date.now() * 0.001);
      const minimapX = x + center + pos.x * scale;
      const minimapY = y + center + pos.y * scale;

      this.ctx.fillStyle = project.theme.color;
      this.ctx.beginPath();
      this.ctx.arc(minimapX, minimapY, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Camera viewport
    const viewportWidth = (this.canvas.width / this.camera.zoom) * scale;
    const viewportHeight = (this.canvas.height / this.camera.zoom) * scale;
    const viewportX = x + center - (this.camera.x * scale) - viewportWidth / 2;
    const viewportY = y + center - (this.camera.y * scale) - viewportHeight / 2;

    this.ctx.strokeStyle = this.theme.colors.accentPrimary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
  }

  /**
   * Render project tooltip
   */
  private renderTooltip(projectId: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const pos = this.calculateProjectScreenPosition(project);
    const padding = 10;
    const width = 200;
    const height = 100;

    let x = pos.x + 20;
    let y = pos.y - height / 2;

    // Keep tooltip on screen
    if (x + width > this.canvas.width) {
      x = pos.x - width - 20;
    }

    if (y < 0) {
      y = padding;
    } else if (y + height > this.canvas.height) {
      y = this.canvas.height - height - padding;
    }

    // Background
    this.ctx.fillStyle = this.theme.colors.backgroundSecondary + 'EE';
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = project.theme.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Content
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.font = `bold ${this.theme.typography.fontSize.md} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.fillText(project.name, x + padding, y + padding + 16);

    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.fillStyle = this.theme.colors.textSecondary;

    const lines = [
      `Files: ${project.stats.files}`,
      `Lines: ${project.stats.lines.toLocaleString()}`,
      `Health: ${project.stats.health}%`,
      `Last active: ${this.formatDate(project.lastModified)}`
    ];

    lines.forEach((line, index) => {
      this.ctx.fillText(line, x + padding, y + padding + 40 + index * 16);
    });
  }

  /**
   * Render controls hint
   */
  private renderControlsHint(): void {
    const hints = [
      'Scroll: Zoom',
      'Drag: Pan',
      'Click: Select'
    ];

    const margin = 20;
    const lineHeight = 20;

    this.ctx.fillStyle = this.theme.colors.textTertiary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;

    hints.forEach((hint, index) => {
      this.ctx.fillText(hint, margin, this.canvas.height - margin - (hints.length - index - 1) * lineHeight);
    });
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
   * Handle window resize
   */
  private handleResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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
    } else if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      if (touch1 && touch2) {
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (this.pinchDistance !== undefined) {
          const scale = distance / this.pinchDistance;
          this.camera.zoom *= scale;
          this.camera.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.camera.zoom));
        }

        this.pinchDistance = distance;
      }
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.handleMouseUp();
      this.pinchDistance = undefined;
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        break;
      case '+':
      case '=':
        this.camera.zoom = Math.min(this.MAX_ZOOM, this.camera.zoom * 1.1);
        break;
      case '-':
      case '_':
        this.camera.zoom = Math.max(this.MIN_ZOOM, this.camera.zoom * 0.9);
        break;
      case 'ArrowUp':
        this.camera.y -= 50 / this.camera.zoom;
        break;
      case 'ArrowDown':
        this.camera.y += 50 / this.camera.zoom;
        break;
      case 'ArrowLeft':
        this.camera.x -= 50 / this.camera.zoom;
        break;
      case 'ArrowRight':
        this.camera.x += 50 / this.camera.zoom;
        break;
    }
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
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }

  // Private member fields
  private pinchDistance: number | undefined;
}

// Supporting interfaces
interface Camera {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

interface MouseState {
  x: number;
  y: number;
  down: boolean;
  dragging: boolean;
  startX: number;
  startY: number;
}

interface Point {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
}