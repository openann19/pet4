/**
 * WebGL Utilities
 * Provides WebGL context management, shader caching, texture management, and resource cleanup
 */

import { createLogger } from './logger';

const logger = createLogger('WebGLUtils');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WebGLContextOptions {
  readonly alpha?: boolean;
  readonly antialias?: boolean;
  readonly depth?: boolean;
  readonly stencil?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly powerPreference?: 'default' | 'low-power' | 'high-performance';
  readonly failIfMajorPerformanceCaveat?: boolean;
  readonly premultipliedAlpha?: boolean;
  readonly desynchronized?: boolean;
}

export interface ShaderProgram {
  readonly program: WebGLProgram;
  readonly vertexShader: WebGLShader;
  readonly fragmentShader: WebGLShader;
  readonly uniforms: Map<string, WebGLUniformLocation>;
  readonly attributes: Map<string, number>;
}

export interface TextureOptions {
  readonly minFilter?: number;
  readonly magFilter?: number;
  readonly wrapS?: number;
  readonly wrapT?: number;
  readonly format?: number;
  readonly internalFormat?: number;
  readonly type?: number;
  readonly generateMipmaps?: boolean;
}

export interface FramebufferInfo {
  readonly framebuffer: WebGLFramebuffer;
  readonly texture: WebGLTexture;
  readonly width: number;
  readonly height: number;
  readonly renderbuffer?: WebGLRenderbuffer;
}

// ============================================================================
// WebGL Context Manager
// ============================================================================

export class WebGLContextManager {
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
  private readonly isWebGL2: boolean;
  private readonly shaderCache = new Map<string, ShaderProgram>();
  private readonly textureCache = new Map<string, WebGLTexture>();
  private readonly framebufferCache = new Map<string, FramebufferInfo>();
  private readonly programs = new Set<WebGLProgram>();
  private readonly textures = new Set<WebGLTexture>();
  private readonly framebuffers = new Set<WebGLFramebuffer>();
  private readonly renderbuffers = new Set<WebGLRenderbuffer>();

  constructor(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    options: WebGLContextOptions = {}
  ) {
    const defaultOptions: WebGLContextOptions = {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      premultipliedAlpha: true,
      desynchronized: false,
      ...options,
    };

    // Try WebGL2 first, fallback to WebGL
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    if (canvas instanceof HTMLCanvasElement) {
      const webgl2Context = canvas.getContext('webgl2', defaultOptions);
      if (webgl2Context && webgl2Context instanceof WebGL2RenderingContext) {
        gl = webgl2Context;
      } else {
        const webglContext = canvas.getContext('webgl', defaultOptions) ?? canvas.getContext('experimental-webgl', defaultOptions);
        if (webglContext && webglContext instanceof WebGLRenderingContext) {
          gl = webglContext;
        }
      }
    }

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;

    logger.info('WebGL context initialized', {
      isWebGL2: this.isWebGL2,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
    });
  }

  getGL(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.gl;
  }

  isWebGL2Context(): boolean {
    return this.isWebGL2;
  }

  // ============================================================================
  // Shader Management
  // ============================================================================

  /**
   * Compile shader from source
   */
  compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${info ?? 'Unknown error'}`);
    }

    return shader;
  }

  /**
   * Create shader program from vertex and fragment shader sources
   * Results are cached by source hash
   */
  createShaderProgram(
    vertexSource: string,
    fragmentSource: string,
    cacheKey?: string
  ): ShaderProgram {
    const key = cacheKey ?? this.hashShaderSource(vertexSource, fragmentSource);

    // Check cache
    const cached = this.shaderCache.get(key);
    if (cached) {
      return cached;
    }

    // Compile shaders
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource
    );

    // Create program
    const program = this.gl.createProgram();
    if (!program) {
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      throw new Error(`Shader program linking error: ${info ?? 'Unknown error'}`);
    }

    // Extract uniforms and attributes
    const uniforms = new Map<string, WebGLUniformLocation>();
    const attributes = new Map<string, number>();

    const uniformCount = this.gl.getProgramParameter(
      program,
      this.gl.ACTIVE_UNIFORMS
    );
    for (let i = 0; i < uniformCount; i++) {
      const info = this.gl.getActiveUniform(program, i);
      if (info) {
        const location = this.gl.getUniformLocation(program, info.name);
        if (location !== null) {
          uniforms.set(info.name, location);
        }
      }
    }

    const attributeCount = this.gl.getProgramParameter(
      program,
      this.gl.ACTIVE_ATTRIBUTES
    );
    for (let i = 0; i < attributeCount; i++) {
      const info = this.gl.getActiveAttrib(program, i);
      if (info) {
        const location = this.gl.getAttribLocation(program, info.name);
        attributes.set(info.name, location);
      }
    }

    // Cleanup shaders after linking
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    const shaderProgram: ShaderProgram = {
      program,
      vertexShader,
      fragmentShader,
      uniforms,
      attributes,
    };

    this.shaderCache.set(key, shaderProgram);
    this.programs.add(program);

    return shaderProgram;
  }

  /**
   * Hash shader source for caching
   */
  private hashShaderSource(vertex: string, fragment: string): string {
    // Simple hash function
    let hash = 0;
    const combined = vertex + fragment;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `shader_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Delete shader program and remove from cache
   */
  deleteShaderProgram(key: string): void {
    const program = this.shaderCache.get(key);
    if (program) {
      this.gl.deleteProgram(program.program);
      this.shaderCache.delete(key);
      this.programs.delete(program.program);
    }
  }

  // ============================================================================
  // Texture Management
  // ============================================================================

  /**
   * Create texture from image source
   */
  createTexture(
    source: HTMLImageElement | HTMLVideoElement | ImageData | HTMLCanvasElement,
    options: TextureOptions = {},
    cacheKey?: string
  ): WebGLTexture {
    const key = cacheKey ?? this.generateTextureKey(source);

    // Check cache
    const cached = this.textureCache.get(key);
    if (cached) {
      return cached;
    }

    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    const minFilter =
      options.minFilter ?? (options.generateMipmaps ? this.gl.LINEAR_MIPMAP_LINEAR : this.gl.LINEAR);
    const magFilter = options.magFilter ?? this.gl.LINEAR;
    const wrapS = options.wrapS ?? this.gl.CLAMP_TO_EDGE;
    const wrapT = options.wrapT ?? this.gl.CLAMP_TO_EDGE;

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT);

    // Upload texture data
    if (source instanceof ImageData) {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        options.internalFormat ?? this.gl.RGBA,
        options.format ?? this.gl.RGBA,
        options.type ?? this.gl.UNSIGNED_BYTE,
        source
      );
    } else {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        options.internalFormat ?? this.gl.RGBA,
        options.format ?? this.gl.RGBA,
        options.type ?? this.gl.UNSIGNED_BYTE,
        source
      );
    }

    // Generate mipmaps if requested
    if (options.generateMipmaps) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    this.textureCache.set(key, texture);
    this.textures.add(texture);

    return texture;
  }

  /**
   * Update texture with new image data
   */
  updateTexture(
    texture: WebGLTexture,
    source: HTMLImageElement | HTMLVideoElement | ImageData | HTMLCanvasElement,
    x = 0,
    y = 0
  ): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    if (source instanceof ImageData) {
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        x,
        y,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        source
      );
    } else {
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        x,
        y,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        source
      );
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * Generate cache key for texture
   */
  private generateTextureKey(
    source: HTMLImageElement | HTMLVideoElement | ImageData | HTMLCanvasElement
  ): string {
    if (source instanceof HTMLImageElement) {
      return `img_${source.src}_${source.width}x${source.height}`;
    }
    if (source instanceof HTMLVideoElement) {
      return `video_${source.src}_${source.videoWidth}x${source.videoHeight}`;
    }
    if (source instanceof ImageData) {
      return `imagedata_${source.width}x${source.height}`;
    }
    if (source instanceof HTMLCanvasElement) {
      return `canvas_${source.width}x${source.height}`;
    }
    return `texture_${Date.now()}_${Math.random()}`;
  }

  /**
   * Delete texture and remove from cache
   */
  deleteTexture(key: string): void {
    const texture = this.textureCache.get(key);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textureCache.delete(key);
      this.textures.delete(texture);
    }
  }

  // ============================================================================
  // Framebuffer Management
  // ============================================================================

  /**
   * Create framebuffer with texture attachment
   */
  createFramebuffer(
    width: number,
    height: number,
    options: {
      readonly depth?: boolean;
      readonly stencil?: boolean;
      readonly cacheKey?: string;
    } = {}
  ): FramebufferInfo {
    const key = options.cacheKey ?? `fb_${width}x${height}_${Date.now()}`;

    // Check cache
    const cached = this.framebufferCache.get(key);
    if (cached?.width === width && cached.height === height) {
      return cached;
    }

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error('Failed to create framebuffer');
    }

    // Create texture for framebuffer
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create framebuffer texture');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    this.textures.add(texture);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    let renderbuffer: WebGLRenderbuffer | undefined;
    if (options.depth || options.stencil) {
      renderbuffer = this.gl.createRenderbuffer();
      if (renderbuffer) {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
        const format =
          options.depth && options.stencil
            ? this.gl.DEPTH_STENCIL
            : options.depth
              ? this.gl.DEPTH_COMPONENT16
              : this.gl.STENCIL_INDEX8;
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, format, width, height);
        this.gl.framebufferRenderbuffer(
          this.gl.FRAMEBUFFER,
          options.depth && options.stencil
            ? this.gl.DEPTH_STENCIL_ATTACHMENT
            : options.depth
              ? this.gl.DEPTH_ATTACHMENT
              : this.gl.STENCIL_ATTACHMENT,
          this.gl.RENDERBUFFER,
          renderbuffer
        );
      }
    }

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      this.gl.deleteFramebuffer(framebuffer);
      this.gl.deleteTexture(texture);
      if (renderbuffer) {
        this.gl.deleteRenderbuffer(renderbuffer);
      }
      throw new Error(`Framebuffer incomplete: ${status}`);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    if (renderbuffer) {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    }

    const fbInfo: FramebufferInfo = {
      framebuffer,
      texture,
      width,
      height,
      renderbuffer,
    };

    this.framebufferCache.set(key, fbInfo);
    this.framebuffers.add(framebuffer);
    if (renderbuffer) {
      this.renderbuffers.add(renderbuffer);
    }

    return fbInfo;
  }

  /**
   * Delete framebuffer and remove from cache
   */
  deleteFramebuffer(key: string): void {
    const fbInfo = this.framebufferCache.get(key);
    if (fbInfo) {
      this.gl.deleteFramebuffer(fbInfo.framebuffer);
      this.gl.deleteTexture(fbInfo.texture);
      if (fbInfo.renderbuffer) {
        this.gl.deleteRenderbuffer(fbInfo.renderbuffer);
      }
      this.framebufferCache.delete(key);
      this.framebuffers.delete(fbInfo.framebuffer);
      if (fbInfo.renderbuffer) {
        this.renderbuffers.delete(fbInfo.renderbuffer);
      }
    }
  }

  // ============================================================================
  // Resource Cleanup
  // ============================================================================

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    logger.info('Cleaning up WebGL resources', {
      shaders: this.shaderCache.size,
      textures: this.textureCache.size,
      framebuffers: this.framebufferCache.size,
    });

    // Delete all shader programs
    for (const program of this.programs) {
      this.gl.deleteProgram(program);
    }
    this.shaderCache.clear();
    this.programs.clear();

    // Delete all textures
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture);
    }
    this.textureCache.clear();
    this.textures.clear();

    // Delete all framebuffers
    for (const framebuffer of this.framebuffers) {
      this.gl.deleteFramebuffer(framebuffer);
    }
    for (const renderbuffer of this.renderbuffers) {
      this.gl.deleteRenderbuffer(renderbuffer);
    }
    for (const fbInfo of this.framebufferCache.values()) {
      this.gl.deleteTexture(fbInfo.texture);
    }
    this.framebufferCache.clear();
    this.framebuffers.clear();
    this.renderbuffers.clear();
  }

  /**
   * Get resource statistics
   */
  getStats(): {
    readonly shaders: number;
    readonly textures: number;
    readonly framebuffers: number;
    readonly totalResources: number;
  } {
    return {
      shaders: this.shaderCache.size,
      textures: this.textureCache.size,
      framebuffers: this.framebufferCache.size,
      totalResources:
        this.programs.size +
        this.textures.size +
        this.framebuffers.size +
        this.renderbuffers.size,
    };
  }
}

// ============================================================================
// Default Vertex Shader
// ============================================================================

export const DEFAULT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// ============================================================================
// Default Fragment Shader
// ============================================================================

export const DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;
