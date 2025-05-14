// src/core/FileConstellation.ts

import { FileNode, FileType, FileCluster } from '../types/file';
import { Theme } from '../types/theme';
import { CanvasUtils } from '../utils/canvas';
import { AnimationManager, SpringAnimation } from '../utils/animations';
import { ValidationError } from '../utils/errors';

/**
 * File constellation visualization component
 * Displays files as interconnected stars in clusters
 */
export class FileConstellation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private files: Map<string, FileNodeVisualization>;
  private theme: Theme;
  private animationManager: AnimationManager;
  
  private camera: Camera;
  private mouse: MouseState;
  private hoveredFile: string | null = null;
  private selectedFiles: Set<string> = new Set();
  
  private clusters: Map<FileCluster, ClusterInfo>;
  private connections: Connection[];
  private particles: Particle[];
  
  private readonly CLUSTER_RADIUS = 200;
  private readonly FILE_BASE_SIZE = 8;
  private readonly CONNECTION_OPACITY = 0.3;
  private readonly PARTICLE_COUNT = 50;

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
    this.files = new Map();
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
    
    this.clusters = this.initializeClusters();
    this.connections = [];
    this.particles = this.generateParticles();
    
    this.setupEventListeners();
    this.startRenderLoop();
  }

  /**
   * Add files to the constellation
   */
  public addFiles(files: FileNode[]): void {
    files.forEach(file => {
      if (!file || !file.id) {
        throw new ValidationError('file', file, 'Invalid file: missing id');
      }
      
      // Create visualization node
      const fileViz = this.createFileVisualization(file);
      this.files.set(file.id, fileViz);
      
      // Create connections
      this.createConnections(file);
      
      // Animate addition
      this.animationManager.animate(`add-${file.id}`, {
        from: { scale: 0, opacity: 0 },
        to: { scale: 1, opacity: 1 },
        duration: 800,
        easing: 'easeOutElastic',
        onUpdate: (value: any) => {
          fileViz.scale = value.scale;
          fileViz.opacity = value.opacity;
        }
      });
    });
    
    // Reorganize constellation
    this.reorganizeConstellation();
  }

  /**
   * Remove files from the constellation
   */
  public removeFiles(fileIds: string[]): void {
    fileIds.forEach(id => {
      const fileViz = this.files.get(id);
      if (!fileViz) return;
      
      // Animate removal
      this.animationManager.animate(`remove-${id}`, {
        from: { scale: 1, opacity: 1 },
        to: { scale: 0, opacity: 0 },
        duration: 500,
        easing: 'easeInBack',
        onComplete: () => {
          this.files.delete(id);
          this.removeConnections(id);
        }
      });
    });
  }

  /**
   * Update a file's properties
   */
  public updateFile(fileId: string, updates: Partial<FileNode>): void {
    const fileViz = this.files.get(fileId);
    if (!fileViz) {
      throw new ValidationError('fileId', fileId, 'File not found');
    }
    
    // Update properties
    Object.assign(fileViz.file, updates);
    
    // Update visual properties
    if (updates.visual) {
      this.updateVisualization(fileViz);
    }
    
    if (updates.activity) {
      fileViz.heat = updates.activity.heat || 0;
    }
  }

  /**
   * Filter files by criteria
   */
  public filterFiles(filter: FileFilter): void {
    this.files.forEach((fileViz, id) => {
      const matches = this.matchesFilter(fileViz.file, filter);
      
      this.animationManager.animate(`filter-${id}`, {
        from: fileViz.opacity,
        to: matches ? 1 : 0.1,
        duration: 400,
        easing: 'easeInOutCubic',
        onUpdate: (value: number) => {
          fileViz.opacity = value;
        }
      });
    });
  }

  /**
   * Focus on a specific file
   */
  public focusFile(fileId: string, animated: boolean = true): void {
    const fileViz = this.files.get(fileId);
    if (!fileViz) {
      throw new ValidationError('fileId', fileId, 'File not found');
    }
    
    if (animated) {
      this.animationManager.animate('cameraMove', {
        from: this.camera,
        to: {
          x: fileViz.x,
          y: fileViz.y,
          zoom: 2
        },
        duration: 800,
        easing: 'easeInOutCubic',
        onUpdate: (value: Camera) => {
          this.camera = value;
        }
      });
    } else {
      this.camera.x = fileViz.x;
      this.camera.y = fileViz.y;
      this.camera.zoom = 2;
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
    this.updateThemeColors();
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
    this.renderParticles();
    this.renderClusters();
    this.renderConnections();
    this.renderFiles();
    this.renderLabels();
    
    this.ctx.restore();
    
    // Render UI overlay
    this.renderUI();
  }

  /**
   * Render background particles
   */
  private renderParticles(): void {
    this.ctx.globalAlpha = 0.3;
    
    this.particles.forEach(particle => {
      particle.update();
      
      const gradient = this.ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      );
      
      gradient.addColorStop(0, this.theme.colors.starfield + 'CC');
      gradient.addColorStop(1, this.theme.colors.starfield + '00');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render file clusters
   */
  private renderClusters(): void {
    this.clusters.forEach((cluster, type) => {
      // Cluster area
      const gradient = this.ctx.createRadialGradient(
        cluster.x,
        cluster.y,
        0,
        cluster.x,
        cluster.y,
        this.CLUSTER_RADIUS
      );
      
      gradient.addColorStop(0, cluster.color + '10');
      gradient.addColorStop(0.5, cluster.color + '05');
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cluster.x, cluster.y, this.CLUSTER_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Cluster label
      this.ctx.fillStyle = this.theme.colors.textSecondary;
      this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(cluster.name, cluster.x, cluster.y - this.CLUSTER_RADIUS - 20);
    });
  }

  /**
   * Render connections between files
   */
  private renderConnections(): void {
    this.ctx.globalAlpha = this.CONNECTION_OPACITY;
    
    this.connections.forEach(connection => {
      const from = this.files.get(connection.from);
      const to = this.files.get(connection.to);
      
      if (!from || !to) return;
      
      const gradient = this.ctx.createLinearGradient(
        from.x,
        from.y,
        to.x,
        to.y
      );
      
      gradient.addColorStop(0, connection.color + '00');
      gradient.addColorStop(0.3, connection.color + 'CC');
      gradient.addColorStop(0.7, connection.color + 'CC');
      gradient.addColorStop(1, connection.color + '00');
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = connection.strength;
      this.ctx.setLineDash([5, 10]);
      
      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);
      
      // Curved connection
      const cx = (from.x + to.x) / 2;
      const cy = (from.y + to.y) / 2 - 50;
      this.ctx.quadraticCurveTo(cx, cy, to.x, to.y);
      
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render file nodes
   */
  private renderFiles(): void {
    // Sort by z-index
    const sortedFiles = Array.from(this.files.values())
      .sort((a, b) => a.z - b.z);
    
    sortedFiles.forEach(fileViz => {
      const { file, x, y, scale, opacity, heat } = fileViz;
      
      if (opacity <= 0) return;
      
      this.ctx.globalAlpha = opacity;
      
      // File glow based on heat
      if (heat > 0) {
        const glowSize = this.getFileSize(file) * scale * (1 + heat);
        const glowGradient = this.ctx.createRadialGradient(
          x, y, 0,
          x, y, glowSize
        );
        
        glowGradient.addColorStop(0, fileViz.color + '40');
        glowGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // File node
      const size = this.getFileSize(file) * scale;
      const nodeGradient = this.ctx.createRadialGradient(
        x, y, 0,
        x, y, size
      );
      
      nodeGradient.addColorStop(0, fileViz.color + 'FF');
      nodeGradient.addColorStop(0.7, fileViz.color + 'CC');
      nodeGradient.addColorStop(1, fileViz.color + '80');
      
      this.ctx.fillStyle = nodeGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Selection ring
      if (this.selectedFiles.has(file.id)) {
        this.ctx.strokeStyle = this.theme.colors.accentPrimary;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Hover ring
      if (this.hoveredFile === file.id) {
        this.ctx.strokeStyle = this.theme.colors.accentSecondary;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, size + 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    });
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render file labels
   */
  private renderLabels(): void {
    const zoomThreshold = 1.5;
    if (this.camera.zoom < zoomThreshold) return;
    
    this.files.forEach(fileViz => {
      const { file, x, y, opacity } = fileViz;
      
      if (opacity <= 0.5) return;
      
      this.ctx.globalAlpha = opacity * Math.min(1, (this.camera.zoom - zoomThreshold) / 0.5);
      this.ctx.fillStyle = this.theme.colors.textPrimary;
      this.ctx.font = `${this.theme.typography.fontSize.xs} ${this.theme.typography.fontFamily.primary}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const label = this.truncateLabel(file.name);
      this.ctx.fillText(label, x, y + this.getFileSize(file) + 12);
    });
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render UI overlay
   */
  private renderUI(): void {
    // File count
    this.renderFileCount();
    
    // Selection info
    if (this.selectedFiles.size > 0) {
      this.renderSelectionInfo();
    }
    
    // Tooltip
    if (this.hoveredFile) {
      this.renderTooltip(this.hoveredFile);
    }
  }

  /**
   * Initialize file clusters
   */
  private initializeClusters(): Map<FileCluster, ClusterInfo> {
    const clusters = new Map<FileCluster, ClusterInfo>();
    const centerX = 0;
    const centerY = 0;
    const radius = 300;
    
    const clusterTypes: FileCluster[] = [
      FileCluster.CODE,
      FileCluster.DOCUMENTATION,
      FileCluster.CONFIGURATION,
      FileCluster.MEDIA,
      FileCluster.DATA,
      FileCluster.TEST
    ];
    
    clusterTypes.forEach((type, index) => {
      const angle = (index / clusterTypes.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      clusters.set(type, {
        type,
        name: this.getClusterName(type),
        x,
        y,
        color: this.getClusterColor(type),
        files: []
      });
    });
    
    return clusters;
  }

  /**
   * Create file visualization
   */
  private createFileVisualization(file: FileNode): FileNodeVisualization {
    const cluster = this.clusters.get(file.visual.cluster)!;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.CLUSTER_RADIUS * 0.8;
    
    return {
      file,
      x: cluster.x + Math.cos(angle) * distance,
      y: cluster.y + Math.sin(angle) * distance,
      z: Math.random(),
      scale: 1,
      opacity: 1,
      heat: file.activity.heat,
      color: this.getFileColor(file),
      spring: new SpringAnimation({
        from: 0,
        to: 0,
        stiffness: 170,
        damping: 26
      })
    };
  }

  /**
   * Create connections between related files
   */
  private createConnections(file: FileNode): void {
    if (!file.visual.connections) return;
    
    file.visual.connections.forEach(targetId => {
      // Avoid duplicate connections
      const existingConnection = this.connections.find(c => 
        (c.from === file.id && c.to === targetId) ||
        (c.from === targetId && c.to === file.id)
      );
      
      if (!existingConnection) {
        this.connections.push({
          from: file.id,
          to: targetId,
          strength: 1,
          color: this.theme.colors.textTertiary
        });
      }
    });
  }

  /**
   * Remove connections for a file
   */
  private removeConnections(fileId: string): void {
    this.connections = this.connections.filter(c => 
      c.from !== fileId && c.to !== fileId
    );
  }

  /**
   * Generate background particles
   */
  private generateParticles(): Particle[] {
    const particles: Particle[] = [];
    
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        update() {
          this.x += Math.cos(this.angle) * this.speed;
          this.y += Math.sin(this.angle) * this.speed;
          
          // Wrap around
          if (this.x > 1000) this.x = -1000;
          if (this.x < -1000) this.x = 1000;
          if (this.y > 1000) this.y = -1000;
          if (this.y < -1000) this.y = 1000;
        }
      });
    }
    
    return particles;
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
    
    // Check for file click
    const file = this.getFileAtPosition(worldPos);
    if (file) {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        if (this.selectedFiles.has(file.id)) {
          this.selectedFiles.delete(file.id);
        } else {
          this.selectedFiles.add(file.id);
        }
      } else {
        // Single select
        this.selectedFiles.clear();
        this.selectedFiles.add(file.id);
      }
      
      this.dispatchEvent('fileSelected', { files: Array.from(this.selectedFiles) });
    } else {
      // Clear selection
      this.selectedFiles.clear();
      this.dispatchEvent('fileSelected', { files: [] });
    }
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    
    if (this.mouse.down && !this.mouse.dragging) {
      const dx = Math.abs(event.clientX - this.mouse.startX);
      const dy = Math.abs(event.clientY - this.mouse.startY);
      
      if (dx > 5 || dy > 5) {
        this.mouse.dragging = true;
      }
    }
    
    if (this.mouse.dragging) {
      const dx = event.clientX - this.mouse.startX;
      const dy = event.clientY - this.mouse.startY;
      
      this.camera.x -= dx / this.camera.zoom;
      this.camera.y -= dy / this.camera.zoom;
      
      this.mouse.startX = event.clientX;
      this.mouse.startY = event.clientY;
    } else {
      // Check for hover
      const worldPos = this.screenToWorld({
        x: event.clientX,
        y: event.clientY
      });
      
      const file = this.getFileAtPosition(worldPos);
      this.hoveredFile = file ? file.id : null;
      
      this.canvas.style.cursor = file ? 'pointer' : 'grab';
    }
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    this.mouse.down = false;
    this.mouse.dragging = false;
    
    this.canvas.style.cursor = 'grab';
  }

  /**
   * Handle wheel event for zoom
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.camera.zoom * zoomDelta;
    
    if (newZoom >= 0.1 && newZoom <= 5) {
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
   * Get file at world position
   */
  private getFileAtPosition(position: Point): FileNode | null {
    for (const [id, fileViz] of this.files) {
      const distance = Math.sqrt(
        Math.pow(position.x - fileViz.x, 2) +
        Math.pow(position.y - fileViz.y, 2)
      );
      
      const size = this.getFileSize(fileViz.file) * fileViz.scale;
      
      if (distance <= size) {
        return fileViz.file;
      }
    }
    
    return null;
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(point: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    const x = (point.x - rect.left - rect.width / 2) / this.camera.zoom + this.camera.x;
    const y = (point.y - rect.top - rect.height / 2) / this.camera.zoom + this.camera.y;
    
    return { x, y };
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
   * Get file size based on properties
   */
  private getFileSize(file: FileNode): number {
    const sizeMultiplier = Math.log10(file.size + 1) / 10;
    return this.FILE_BASE_SIZE * (1 + sizeMultiplier);
  }

  /**
   * Get file color based on type
   */
  private getFileColor(file: FileNode): string {
    const typeColors: Record<FileType, string> = {
      [FileType.JAVASCRIPT]: '#F0DB4F',
      [FileType.TYPESCRIPT]: '#3178C6',
      [FileType.PYTHON]: '#3776AB',
      [FileType.JAVA]: '#007396',
      [FileType.CPP]: '#00599C',
      [FileType.RUST]: '#CE422B',
      [FileType.GO]: '#00ADD8',
      [FileType.HTML]: '#E34C26',
      [FileType.CSS]: '#1572B6',
      [FileType.SCSS]: '#CC6699',
      [FileType.JSON]: '#000000',
      [FileType.XML]: '#FF6600',
      [FileType.YAML]: '#CB171E',
      [FileType.CSV]: '#1D6F42',
      [FileType.MARKDOWN]: '#083FA1',
      [FileType.TEXT]: '#666666',
      [FileType.PDF]: '#FF0000',
      [FileType.IMAGE]: '#FFB13B',
      [FileType.VIDEO]: '#FF0000',
      [FileType.AUDIO]: '#00C853',
      [FileType.BINARY]: '#666666',
      [FileType.UNKNOWN]: '#999999'
    };
    
    return typeColors[file.type] || this.theme.colors.textPrimary;
  }

  /**
   * Get cluster name
   */
  private getClusterName(cluster: FileCluster): string {
    const names: Record<FileCluster, string> = {
      [FileCluster.CODE]: 'Code',
      [FileCluster.DOCUMENTATION]: 'Documentation',
      [FileCluster.CONFIGURATION]: 'Configuration',
      [FileCluster.MEDIA]: 'Media',
      [FileCluster.DATA]: 'Data',
      [FileCluster.TEST]: 'Tests'
    };
    
    return names[cluster];
  }

  /**
   * Get cluster color
   */
  private getClusterColor(cluster: FileCluster): string {
    const colors: Record<FileCluster, string> = {
      [FileCluster.CODE]: this.theme.colors.info,
      [FileCluster.DOCUMENTATION]: this.theme.colors.success,
      [FileCluster.CONFIGURATION]: this.theme.colors.warning,
      [FileCluster.MEDIA]: this.theme.colors.error,
      [FileCluster.DATA]: this.theme.colors.accentPrimary,
      [FileCluster.TEST]: this.theme.colors.accentSecondary
    };
    
    return colors[cluster];
  }

  /**
   * Truncate label for display
   */
  private truncateLabel(label: string, maxLength: number = 20): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }

  /**
   * Reorganize constellation layout
   */
  private reorganizeConstellation(): void {
    // Group files by cluster
    this.clusters.forEach(cluster => {
      cluster.files = [];
    });
    
    this.files.forEach(fileViz => {
      const cluster = this.clusters.get(fileViz.file.visual.cluster);
      if (cluster) {
        cluster.files.push(fileViz);
      }
    });
    
    // Layout files within clusters
    this.clusters.forEach(cluster => {
      const fileCount = cluster.files.length;
      if (fileCount === 0) return;
      
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      
      cluster.files.forEach((fileViz, index) => {
        const angle = index * goldenAngle;
        const radius = Math.sqrt(index / fileCount) * this.CLUSTER_RADIUS * 0.8;
        
        const targetX = cluster.x + Math.cos(angle) * radius;
        const targetY = cluster.y + Math.sin(angle) * radius;
        
        this.animationManager.animate(`layout-${fileViz.file.id}`, {
          from: { x: fileViz.x, y: fileViz.y },
          to: { x: targetX, y: targetY },
          duration: 1000,
          easing: 'easeInOutCubic',
          onUpdate: (value: { x: number, y: number }) => {
            fileViz.x = value.x;
            fileViz.y = value.y;
          }
        });
      });
    });
  }

  /**
   * Update visualization properties
   */
  private updateVisualization(fileViz: FileNodeVisualization): void {
    fileViz.color = this.getFileColor(fileViz.file);
    fileViz.x = fileViz.file.visual.x;
    fileViz.y = fileViz.file.visual.y;
  }

  /**
   * Update theme colors
   */
  private updateThemeColors(): void {
    this.files.forEach(fileViz => {
      fileViz.color = this.getFileColor(fileViz.file);
    });
    
    this.clusters.forEach((cluster, type) => {
      cluster.color = this.getClusterColor(type);
    });
  }

  /**
   * Match file against filter
   */
  private matchesFilter(file: FileNode, filter: FileFilter): boolean {
    if (filter.types && !filter.types.includes(file.type)) {
      return false;
    }
    
    if (filter.clusters && !filter.clusters.includes(file.visual.cluster)) {
      return false;
    }
    
    if (filter.minSize !== undefined && file.size < filter.minSize) {
      return false;
    }
    
    if (filter.maxSize !== undefined && file.size > filter.maxSize) {
      return false;
    }
    
    if (filter.modifiedAfter && file.activity.modified < filter.modifiedAfter) {
      return false;
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      return file.name.toLowerCase().includes(query) ||
             file.path.toLowerCase().includes(query);
    }
    
    return true;
  }

  /**
   * Render file count
   */
  private renderFileCount(): void {
    const activeFiles = Array.from(this.files.values())
      .filter(f => f.opacity > 0.5).length;
    
    this.ctx.fillStyle = this.theme.colors.textSecondary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Files: ${activeFiles}/${this.files.size}`, 20, 30);
  }

  /**
   * Render selection info
   */
  private renderSelectionInfo(): void {
    const selected = this.selectedFiles.size;
    
    this.ctx.fillStyle = this.theme.colors.accentPrimary;
    this.ctx.font = `${this.theme.typography.fontSize.sm} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Selected: ${selected}`, 20, 50);
  }

  /**
   * Render tooltip
   */
  private renderTooltip(fileId: string): void {
    const fileViz = this.files.get(fileId);
    if (!fileViz) return;
    
    const file = fileViz.file;
    const screenPos = this.worldToScreen({ x: fileViz.x, y: fileViz.y });
    
    // Tooltip dimensions
    const padding = 10;
    const lineHeight = 18;
    const lines = [
      file.name,
      `Type: ${file.type}`,
      `Size: ${this.formatFileSize(file.size)}`,
      `Modified: ${this.formatDate(file.activity.modified)}`
    ];
    
    const maxWidth = Math.max(...lines.map(line => 
      this.ctx.measureText(line).width
    ));
    
    const width = maxWidth + padding * 2;
    const height = lines.length * lineHeight + padding * 2;
    
    let x = screenPos.x + 20;
    let y = screenPos.y - height / 2;
    
    // Keep tooltip on screen
    if (x + width > this.canvas.width) {
      x = screenPos.x - width - 20;
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
    this.ctx.strokeStyle = fileViz.color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Content
    this.ctx.fillStyle = this.theme.colors.textPrimary;
    this.ctx.font = `${this.theme.typography.fontSize.xs} ${this.theme.typography.fontFamily.primary}`;
    this.ctx.textAlign = 'left';
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, x + padding, y + padding + (index + 1) * lineHeight - 4);
    });
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  private worldToScreen(point: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    const x = (point.x - this.camera.x) * this.camera.zoom + rect.width / 2;
    const y = (point.y - this.camera.y) * this.camera.zoom + rect.height / 2;
    
    return { x, y };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
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
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Select all
          this.files.forEach((_, id) => {
            this.selectedFiles.add(id);
          });
          this.dispatchEvent('fileSelected', { files: Array.from(this.selectedFiles) });
        }
        break;
      
      case 'Escape':
        // Clear selection
        this.selectedFiles.clear();
        this.dispatchEvent('fileSelected', { files: [] });
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
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
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
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Supporting interfaces
interface FileNodeVisualization {
  file: FileNode;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  heat: number;
  color: string;
  spring: SpringAnimation;
}

interface ClusterInfo {
  type: FileCluster;
  name: string;
  x: number;
  y: number;
  color: string;
  files: FileNodeVisualization[];
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  update(): void;
}

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

interface FileFilter {
  types?: FileType[];
  clusters?: FileCluster[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  searchQuery?: string;
}