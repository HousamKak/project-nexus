// src/utils/animations.ts

/**
 * Animation utility classes for Project Nexus
 */

/**
 * Easing functions for smooth animations
 */
export class Easing {
  public static linear(t: number): number {
    return t;
  }

  public static easeInQuad(t: number): number {
    return t * t;
  }

  public static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  public static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  public static easeInCubic(t: number): number {
    return t * t * t;
  }

  public static easeOutCubic(t: number): number {
    return (--t) * t * t + 1;
  }

  public static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  public static easeInQuart(t: number): number {
    return t * t * t * t;
  }

  public static easeOutQuart(t: number): number {
    return 1 - (--t) * t * t * t;
  }

  public static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
  }

  public static easeInQuint(t: number): number {
    return t * t * t * t * t;
  }

  public static easeOutQuint(t: number): number {
    return 1 + (--t) * t * t * t * t;
  }

  public static easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
  }

  public static easeInSine(t: number): number {
    return 1 - Math.cos(t * Math.PI / 2);
  }

  public static easeOutSine(t: number): number {
    return Math.sin(t * Math.PI / 2);
  }

  public static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  public static easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }

  public static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  public static easeInOutExpo(t: number): number {
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ?
      Math.pow(2, 20 * t - 10) / 2 :
      (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  public static easeInCirc(t: number): number {
    return 1 - Math.sqrt(1 - t * t);
  }

  public static easeOutCirc(t: number): number {
    return Math.sqrt(1 - (--t) * t);
  }

  public static easeInOutCirc(t: number): number {
    return t < 0.5 ?
      (1 - Math.sqrt(1 - 4 * t * t)) / 2 :
      (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
  }

  public static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  public static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  public static easeInOutElastic(t: number): number {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  }

  public static easeInBounce(t: number): number {
    return 1 - this.easeOutBounce(1 - t);
  }

  public static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  public static easeInOutBounce(t: number): number {
    return t < 0.5
      ? (1 - this.easeOutBounce(1 - 2 * t)) / 2
      : (1 + this.easeOutBounce(2 * t - 1)) / 2;
  }

  public static easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  public static easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  public static easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  /**
   * Get easing function by name
   */
  public static getEasingFunction(name: string): (t: number) => number {
    return (this as any)[name] || this.linear;
  }
}

/**
 * Animation instance
 */
export class Animation {
  private id: string;
  private startTime: number;
  private duration: number;
  private from: any;
  private to: any;
  private easing: (t: number) => number;
  private onUpdate: (value: any) => void;
  private onComplete?: () => void;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private pausedTime: number = 0;

  constructor(config: AnimationConfig) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.duration = config.duration;
    this.from = config.from;
    this.to = config.to;
    this.easing = typeof config.easing === 'string' 
      ? Easing.getEasingFunction(config.easing)
      : config.easing || Easing.linear;
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete || undefined;
    this.startTime = Date.now();
  }

  /**
   * Start the animation
   */
  public start(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
  }

  /**
   * Pause the animation
   */
  public pause(): void {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
      this.pausedTime = Date.now() - this.startTime;
    }
  }

  /**
   * Resume the animation
   */
  public resume(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.startTime = Date.now() - this.pausedTime;
    }
  }

  /**
   * Stop the animation
   */
  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * Update the animation
   */
  public update(): boolean {
    if (!this.isRunning || this.isPaused) {
      return true;
    }

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);

    const currentValue = this.interpolate(this.from, this.to, easedProgress);
    this.onUpdate(currentValue);

    if (progress >= 1) {
      this.isRunning = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return false;
    }

    return true;
  }

  /**
   * Interpolate between values
   */
  private interpolate(from: any, to: any, progress: number): any {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }

    if (Array.isArray(from) && Array.isArray(to)) {
      return from.map((value, index) => 
        this.interpolate(value, to[index], progress)
      );
    }

    if (typeof from === 'object' && typeof to === 'object') {
      const result: any = {};
      for (const key in from) {
        if (key in to) {
          result[key] = this.interpolate(from[key], to[key], progress);
        }
      }
      return result;
    }

    return to;
  }

  /**
   * Get animation ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Check if animation is running
   */
  public isAnimating(): boolean {
    return this.isRunning;
  }

  /**
   * Get animation progress
   */
  public getProgress(): any {
    if (!this.isRunning) return { opacity: 1, scale: 1 };

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);

    return this.interpolate(this.from, this.to, easedProgress);
  }
}

/**
 * Animation manager
 */
export class AnimationManager {
  public readonly animations: Map<string, Animation> = new Map();
  private rafId: number | null = null;
  private isRunning: boolean = false;

  /**
   * Create and start an animation
   */
  public animate(name: string, config: Partial<AnimationConfig>): Animation {
    // Stop existing animation with same name
    if (this.animations.has(name)) {
      this.stop(name);
    }

    const animation = new Animation({
      id: name,
      duration: 1000,
      from: 0,
      to: 1,
      easing: 'easeInOutCubic',
      onUpdate: () => {},
      ...config
    } as AnimationConfig);

    this.animations.set(name, animation);
    animation.start();

    if (!this.isRunning) {
      this.start();
    }

    return animation;
  }

  /**
   * Stop an animation
   */
  public stop(name: string): void {
    const animation = this.animations.get(name);
    if (animation) {
      animation.stop();
      this.animations.delete(name);
    }
  }

  /**
   * Pause an animation
   */
  public pause(name: string): void {
    const animation = this.animations.get(name);
    if (animation) {
      animation.pause();
    }
  }

  /**
   * Resume an animation
   */
  public resume(name: string): void {
    const animation = this.animations.get(name);
    if (animation) {
      animation.resume();
    }
  }

  /**
   * Stop all animations
   */
  public stopAll(): void {
    this.animations.forEach(animation => animation.stop());
    this.animations.clear();
  }

  /**
   * Pause all animations
   */
  public pauseAll(): void {
    this.animations.forEach(animation => animation.pause());
  }

  /**
   * Resume all animations
   */
  public resumeAll(): void {
    this.animations.forEach(animation => animation.resume());
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    this.isRunning = true;
    this.update();
  }

  /**
   * Update all animations
   */
  public update(): void {
    if (!this.isRunning) return;

    const toRemove: string[] = [];

    this.animations.forEach((animation, name) => {
      if (!animation.update()) {
        toRemove.push(name);
      }
    });

    toRemove.forEach(name => this.animations.delete(name));

    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(() => this.update());
    } else {
      this.isRunning = false;
    }
  }

  /**
   * Destroy the animation manager
   */
  public destroy(): void {
    this.stopAll();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.isRunning = false;
  }
}

/**
 * Spring animation
 */
export class SpringAnimation {
  private value: number;
  private velocity: number;
  private target: number;
  private stiffness: number;
  private damping: number;
  private mass: number;
  private threshold: number;

  constructor(config: SpringConfig) {
    this.value = config.from || 0;
    this.velocity = config.velocity || 0;
    this.target = config.to || 0;
    this.stiffness = config.stiffness || 170;
    this.damping = config.damping || 26;
    this.mass = config.mass || 1;
    this.threshold = config.threshold || 0.001;
  }

  /**
   * Update the spring animation
   */
  public update(deltaTime: number): boolean {
    const force = -this.stiffness * (this.value - this.target);
    const damping = -this.damping * this.velocity;
    const acceleration = (force + damping) / this.mass;
    
    this.velocity += acceleration * deltaTime;
    this.value += this.velocity * deltaTime;

    const isComplete = 
      Math.abs(this.velocity) < this.threshold &&
      Math.abs(this.value - this.target) < this.threshold;

    if (isComplete) {
      this.value = this.target;
      this.velocity = 0;
    }

    return !isComplete;
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Set target value
   */
  public setTarget(target: number): void {
    this.target = target;
  }

  /**
   * Reset the spring
   */
  public reset(value: number = 0, velocity: number = 0): void {
    this.value = value;
    this.velocity = velocity;
  }
}

/**
 * Particle system for effects
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private emitters: ParticleEmitter[] = [];
  private maxParticles: number;

  constructor(config: ParticleSystemConfig) {
    this.maxParticles = config.maxParticles || 1000;
  }

  /**
   * Add a particle emitter
   */
  public addEmitter(config: ParticleEmitterConfig): string {
    const emitter = new ParticleEmitter(config);
    this.emitters.push(emitter);
    return emitter.id;
  }

  /**
   * Remove a particle emitter
   */
  public removeEmitter(id: string): void {
    this.emitters = this.emitters.filter(emitter => emitter.id !== id);
  }

  /**
   * Update the particle system
   */
  public update(deltaTime: number): void {
    // Update emitters and create new particles
    this.emitters.forEach(emitter => {
      if (emitter.isActive && this.particles.length < this.maxParticles) {
        const newParticles = emitter.emit(deltaTime);
        this.particles.push(...newParticles);
      }
    });

    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime);
      return particle.isAlive();
    });
  }

  /**
   * Render particles
   */
  public render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => {
      particle.render(ctx);
    });
  }

  /**
   * Get particle count
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles = [];
  }
}

/**
 * Individual particle
 */
class Particle {
  public x: number;
  public y: number;
  private vx: number;
  private vy: number;
  private life: number;
  private maxLife: number;
  private size: number;
  private color: string;
  private alpha: number;

  constructor(config: ParticleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.life = config.life || 1;
    this.maxLife = this.life;
    this.size = config.size || 1;
    this.color = config.color || '#ffffff';
    this.alpha = config.alpha || 1;
  }

  /**
   * Update particle
   */
  public update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    
    // Fade out
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  /**
   * Render particle
   */
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Check if particle is alive
   */
  public isAlive(): boolean {
    return this.life > 0;
  }
}

/**
 * Particle emitter
 */
class ParticleEmitter {
  public id: string;
  public isActive: boolean = true;
  private x: number;
  private y: number;
  private rate: number;
  private accumulator: number = 0;
  private config: ParticleEmitterConfig;

  constructor(config: ParticleEmitterConfig) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.x = config.x;
    this.y = config.y;
    this.rate = config.rate || 10;
    this.config = config;
  }

  /**
   * Emit particles
   */
  public emit(deltaTime: number): Particle[] {
    const particles: Particle[] = [];
    
    this.accumulator += deltaTime * this.rate;
    
    while (this.accumulator >= 1) {
      particles.push(this.createParticle());
      this.accumulator -= 1;
    }
    
    return particles;
  }

  /**
   * Create a single particle
   */
  private createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = this.config.speed || 100;
    const spread = this.config.spread || Math.PI * 2;
    
    const particleAngle = angle + (Math.random() - 0.5) * spread;
    const particleSpeed = speed * (0.5 + Math.random() * 0.5);
    
    return new Particle({
      x: this.x + (Math.random() - 0.5) * (this.config.xVariance || 0),
      y: this.y + (Math.random() - 0.5) * (this.config.yVariance || 0),
      vx: Math.cos(particleAngle) * particleSpeed,
      vy: Math.sin(particleAngle) * particleSpeed,
      life: this.config.life || 1,
      size: this.config.size || 1,
      color: this.config.color || '#ffffff',
      alpha: this.config.alpha || 1
    });
  }

  /**
   * Update emitter position
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

// Interfaces
interface AnimationConfig {
  id?: string;
  duration: number;
  from: any;
  to: any;
  easing?: string | ((t: number) => number);
  delay?: number; // New property for animation delay
  repeat?: number; // New property for repeat count
  direction?: 'normal' | 'reverse' | 'alternate'; // New property for animation direction
  onUpdate: (value: any) => void;
  onComplete?: () => void;
}

interface SpringConfig {
  from?: number;
  to?: number;
  velocity?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  threshold?: number;
}

interface ParticleSystemConfig {
  maxParticles?: number;
}

interface ParticleConfig {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  life?: number;
  size?: number;
  color?: string;
  alpha?: number;
}

interface ParticleEmitterConfig {
  id?: string;
  x: number;
  y: number;
  rate?: number;
  speed?: number;
  spread?: number;
  life?: number;
  size?: number;
  color?: string;
  alpha?: number;
  xVariance?: number;
  yVariance?: number;
}