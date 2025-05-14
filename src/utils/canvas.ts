// src/utils/canvas.ts

/**
 * Canvas utility functions for Project Nexus
 */
export class CanvasUtils {
  /**
   * Get device pixel ratio for high DPI displays
   */
  public static getPixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  /**
   * Setup canvas for high DPI displays
   */
  public static setupHighDPI(canvas: HTMLCanvasElement): void {
    const pixelRatio = this.getPixelRatio();
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
    }
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  /**
   * Clear canvas
   */
  public static clear(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /**
   * Draw circle
   */
  public static drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillColor?: string,
    strokeColor?: string,
    lineWidth: number = 1
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    
    ctx.closePath();
  }

  /**
   * Draw line
   */
  public static drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number = 1,
    dashed: boolean = false
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    
    if (dashed) {
      ctx.setLineDash([5, 5]);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
  }

  /**
   * Draw text
   */
  public static drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'left',
    baseline: CanvasTextBaseline = 'alphabetic',
    maxWidth?: number
  ): void {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    if (maxWidth) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  }

  /**
   * Draw rounded rectangle
   */
  public static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor?: string,
    strokeColor?: string,
    lineWidth: number = 1
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    
    ctx.closePath();
  }

  /**
   * Draw gradient
   */
  public static createLinearGradient(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    colors: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    
    colors.forEach(({ offset, color }) => {
      gradient.addColorStop(offset, color);
    });
    
    return gradient;
  }

  /**
   * Draw radial gradient
   */
  public static createRadialGradient(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
    colors: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    
    colors.forEach(({ offset, color }) => {
      gradient.addColorStop(offset, color);
    });
    
    return gradient;
  }

  /**
   * Draw arc
   */
  public static drawArc(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string,
    width: number = 1,
    counterClockwise: boolean = false
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * Draw polygon
   */
  public static drawPolygon(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    fillColor?: string,
    strokeColor?: string,
    lineWidth: number = 1
  ): void {
    if (points.length < 3) return;

    ctx.beginPath();
    const firstPoint = points[0];
    if (firstPoint) {
      ctx.moveTo(firstPoint.x, firstPoint.y);
    }

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point) {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  /**
   * Draw bezier curve
   */
  public static drawBezierCurve(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x2: number,
    y2: number,
    color: string,
    width: number = 1
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * Draw quadratic curve
   */
  public static drawQuadraticCurve(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    cpx: number,
    cpy: number,
    x2: number,
    y2: number,
    color: string,
    width: number = 1
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpx, cpy, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * Measure text dimensions
   */
  public static measureText(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: string
  ): TextMetrics {
    ctx.font = font;
    return ctx.measureText(text);
  }

  /**
   * Save canvas state
   */
  public static save(ctx: CanvasRenderingContext2D): void {
    ctx.save();
  }

  /**
   * Restore canvas state
   */
  public static restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Apply transform
   */
  public static transform(
    ctx: CanvasRenderingContext2D,
    translateX: number,
    translateY: number,
    scaleX: number,
    scaleY: number,
    rotation: number
  ): void {
    ctx.translate(translateX, translateY);
    ctx.scale(scaleX, scaleY);
    ctx.rotate(rotation);
  }

  /**
   * Reset transform
   */
  public static resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Draw image
   */
  public static drawImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    if (width && height) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }
  }

  /**
   * Create pattern
   */
  public static createPattern(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    repetition: string = 'repeat'
  ): CanvasPattern | null {
    return ctx.createPattern(image, repetition);
  }

  /**
   * Apply shadow
   */
  public static applyShadow(
    ctx: CanvasRenderingContext2D,
    color: string,
    blur: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;
  }

  /**
   * Clear shadow
   */
  public static clearShadow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Set global alpha
   */
  public static setAlpha(ctx: CanvasRenderingContext2D, alpha: number): void {
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Set composite operation
   */
  public static setComposite(
    ctx: CanvasRenderingContext2D,
    operation: GlobalCompositeOperation
  ): void {
    ctx.globalCompositeOperation = operation;
  }

  /**
   * Clip region
   */
  public static clipRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  /**
   * Convert degrees to radians
   */
  public static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Convert radians to degrees
   */
  public static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * Calculate distance between two points
   */
  public static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Calculate angle between two points
   */
  public static angle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Interpolate between two values
   */
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Clamp value between min and max
   */
  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Check if point is inside rectangle
   */
  public static pointInRect(
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  /**
   * Check if point is inside circle
   */
  public static pointInCircle(
    px: number,
    py: number,
    cx: number,
    cy: number,
    radius: number
  ): boolean {
    return this.distance(px, py, cx, cy) <= radius;
  }

  /**
   * Get mouse position relative to canvas
   */
  public static getMousePos(
    canvas: HTMLCanvasElement,
    event: MouseEvent
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  /**
   * Get touch position relative to canvas
   */
  public static getTouchPos(
    canvas: HTMLCanvasElement,
    touch: Touch
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  }

  /**
   * Create offscreen canvas
   */
  public static createOffscreenCanvas(
    width: number,
    height: number
  ): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
  }

  /**
   * Export canvas as image
   */
  public static exportAsImage(
    canvas: HTMLCanvasElement,
    format: string = 'png',
    quality: number = 1.0
  ): string {
    return canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Download canvas as image
   */
  public static downloadAsImage(
    canvas: HTMLCanvasElement,
    filename: string,
    format: string = 'png',
    quality: number = 1.0
  ): void {
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = this.exportAsImage(canvas, format, quality);
    link.click();
  }
}