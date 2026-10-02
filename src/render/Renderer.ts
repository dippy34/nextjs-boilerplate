import {
  ACESFilmicToneMapping, DepthTexture, FloatType, Group, HalfFloatType, LinearFilter, Mesh, NoBlending, NoToneMapping,
  OrthographicCamera, PerspectiveCamera, PlaneGeometry, Quaternion, RGBAFormat, Scene, ShaderMaterial, Vector2,
  Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';

/**
 * HDR renderer.
 *
 * Depth: the scene spans ~1e-1 m (surface) to ~1e27 m (cosmic) in a single
 * pass. We prefer a reversed-Z float32 depth buffer (EXT_clip_control) and
 * fall back to a logarithmic depth buffer where the extension is missing.
 * All objects are positioned relative to the camera (floating origin), so the
 * camera itself always sits at (0,0,0) and only carries a rotation.
 *
 * WebXR: on devices that support immersive VR the renderer uses logarithmic
 * depth (the XR framebuffer's depth format is chosen by the runtime) and, while
 * presenting, draws straight into the headset framebuffer with ACES applied in
 * each material (no bloom pass). The camera hangs off `rig`, a dolly carrying
 * the explorer's orientation; the headset pose is applied on top of it.
 */
export interface ViewInfo {
  /** world orientation of the (left-eye) view */
  quat: Quaternion;
  fovY: number; // degrees
  aspect: number;
  width: number; // pixels of one view
  height: number;
  pixelAngle: number; // radians per pixel
  pixelRatio: number;
  /** far plane of the active projection (Infinity if none) */
  far: number;
  xr: boolean;
}
export type DepthMode = 'reversed-z' | 'logarithmic';

const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class Renderer {
  readonly gl: WebGLRenderer;
  readonly depthMode: DepthMode;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  /**
   * Scene exposure. Applied *inside* every material ("pre-exposure") because a
   * half-float buffer cannot hold physical radiances from faint stars (~1e-7)
   * to the solar disk (~1e5) at once. The composite pass only tone-maps.
   */
  exposure = 1;
  /** user brightness tweak applied in the composite pass */
  postExposure = 1;
  bloomStrength = 0.06;
  private hdr: WebGLRenderTarget;
  private bloomTargets: WebGLRenderTarget[] = [];
  private quad: Mesh;
  private quadScene = new Scene();
  private quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private downMat: ShaderMaterial;
  private upMat: ShaderMaterial;
  private compositeMat: ShaderMaterial;
  width = 1;
  height = 1;
  pixelRatio = 1;

  /** dolly carrying the camera (and VR controllers); its orientation is the explorer's orientation */
  readonly rig = new Group();

  constructor(readonly canvas: HTMLCanvasElement, readonly xrCapable = false) {
    const reversed = !xrCapable && Renderer.supportsClipControl();
    this.depthMode = reversed ? 'reversed-z' : 'logarithmic';
    this.gl = new WebGLRenderer({
      canvas,
      antialias: xrCapable, // MSAA for the headset framebuffer; desktop uses its own MSAA target
      alpha: false,
      powerPreference: 'high-performance',
      reversedDepthBuffer: reversed,
      logarithmicDepthBuffer: !reversed,
      preserveDrawingBuffer: true, // screenshots
    });
    this.gl.autoClear = false;
    this.gl.toneMapping = NoToneMapping;
    this.gl.xr.enabled = xrCapable;
    this.gl.xr.setReferenceSpaceType('local');
    this.camera = new PerspectiveCamera(50, 1, 0.05, 1e30);
    this.camera.matrixAutoUpdate = true;
    this.rig.add(this.camera);
    this.scene.add(this.rig);
    this.hdr = this.makeHdrTarget(1, 1);

    this.downMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
        void main() {
          // 13-tap downsample (Jimenez 2014, "Next Generation Post Processing in Call of Duty")
          vec3 a = texture2D(tSrc, vUv + uTexel * vec2(-2.0, 2.0)).rgb;
          vec3 b = texture2D(tSrc, vUv + uTexel * vec2(0.0, 2.0)).rgb;
          vec3 c = texture2D(tSrc, vUv + uTexel * vec2(2.0, 2.0)).rgb;
          vec3 d = texture2D(tSrc, vUv + uTexel * vec2(-2.0, 0.0)).rgb;
          vec3 e = texture2D(tSrc, vUv).rgb;
          vec3 f = texture2D(tSrc, vUv + uTexel * vec2(2.0, 0.0)).rgb;
          vec3 g = texture2D(tSrc, vUv + uTexel * vec2(-2.0, -2.0)).rgb;
          vec3 h = texture2D(tSrc, vUv + uTexel * vec2(0.0, -2.0)).rgb;
          vec3 i = texture2D(tSrc, vUv + uTexel * vec2(2.0, -2.0)).rgb;
          vec3 j = texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
          vec3 k = texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
          vec3 l = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
          vec3 m = texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
          vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
          gl_FragColor = vec4(min(col, vec3(6.0e4)), 1.0);
        }`,
      uniforms: { tSrc: { value: null }, uTexel: { value: new Vector2() } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.upMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc; uniform sampler2D tPrev; uniform vec2 uTexel; uniform float uRadius; varying vec2 vUv;
        void main() {
          vec2 o = uTexel * uRadius;
          vec3 s = texture2D(tSrc, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(0.0, o.y)).rgb
                 + texture2D(tSrc, vUv + vec2(o.x, o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(-o.x, 0.0)).rgb
                 + 4.0 * texture2D(tSrc, vUv).rgb + 2.0 * texture2D(tSrc, vUv + vec2(o.x, 0.0)).rgb
                 + texture2D(tSrc, vUv + vec2(-o.x, -o.y)).rgb + 2.0 * texture2D(tSrc, vUv + vec2(0.0, -o.y)).rgb
                 + texture2D(tSrc, vUv + vec2(o.x, -o.y)).rgb;
          gl_FragColor = vec4(s / 16.0 + texture2D(tPrev, vUv).rgb, 1.0);
        }`,
      uniforms: { tSrc: { value: null }, tPrev: { value: null }, uTexel: { value: new Vector2() }, uRadius: { value: 1 } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.compositeMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uExposure; uniform float uBloom; varying vec2 vUv;
        // ACES fitted curve (Stephen Hill, BakingLab, MIT licence)
        const mat3 ACESIn = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
        const mat3 ACESOut = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
        vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
        vec3 aces(vec3 c) { c = ACESIn * c; c = RRTAndODTFit(c); return clamp(ACESOut * c, 0.0, 1.0); }
        vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec3 hdr = texture2D(tScene, vUv).rgb + uBloom * texture2D(tBloom, vUv).rgb;
          vec3 c = toSRGB(aces(hdr * uExposure));
          c += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither
          gl_FragColor = vec4(c, 1.0);
        }`,
      uniforms: { tScene: { value: null }, tBloom: { value: null }, uExposure: { value: 1 }, uBloom: { value: 0.05 } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.compositeMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  static supportsClipControl(): boolean {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      const ok = !!gl?.getExtension('EXT_clip_control');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return ok && new URLSearchParams(location.search).get('depth') !== 'log';
    } catch {
      return false;
    }
  }

  private makeHdrTarget(w: number, h: number): WebGLRenderTarget {
    const depthTexture = new DepthTexture(w, h, FloatType);
    return new WebGLRenderTarget(w, h, {
      type: HalfFloatType, format: RGBAFormat, samples: 4, depthBuffer: true, depthTexture,
      minFilter: LinearFilter, magFilter: LinearFilter,
    });
  }

  setSize(cssWidth: number, cssHeight: number, dpr: number): void {
    if (this.presenting) return; // the headset owns the framebuffer size
    this.pixelRatio = dpr;
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(cssWidth, cssHeight, false);
    const w = Math.max(1, Math.floor(cssWidth * dpr));
    const h = Math.max(1, Math.floor(cssHeight * dpr));
    this.width = w;
    this.height = h;
    this.hdr.dispose();
    this.hdr = this.makeHdrTarget(w, h);
    for (const t of this.bloomTargets) t.dispose();
    for (const t of this.twins.values()) t.dispose();
    this.twins.clear();
    this.bloomTargets = [];
    let bw = w, bh = h;
    for (let i = 0; i < 7 && bw > 4 && bh > 4; i++) {
      bw = Math.max(1, bw >> 1);
      bh = Math.max(1, bh >> 1);
      this.bloomTargets.push(new WebGLRenderTarget(bw, bh, { type: HalfFloatType, depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter }));
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Solid angle of one pixel at the centre of the view (sr). */
  pixelSolidAngle(): number {
    const a = (2 * Math.tan((this.camera.fov * Math.PI) / 360)) / this.height;
    return a * a;
  }

  /** Angular size of one pixel (rad). */
  pixelAngle(): number {
    return (2 * Math.tan((this.camera.fov * Math.PI) / 360)) / this.height;
  }

  get presenting(): boolean {
    return this.gl.xr.enabled && this.gl.xr.isPresenting;
  }

  /** Tone mapping inside materials while presenting to a headset. */
  setXrMode(on: boolean): void {
    this.gl.toneMapping = on ? ACESFilmicToneMapping : NoToneMapping;
    // three's ACES multiplies by exposure / 0.6; 0.6 makes it the same curve as the desktop composite
    this.gl.toneMappingExposure = on ? 0.6 : 1;
  }

  private viewQuat = new Quaternion();
  /** Geometry of the current view: desktop camera, or the left eye while presenting. */
  viewInfo(): ViewInfo {
    if (this.presenting) {
      const xrCam = this.gl.xr.getCamera();
      const eye = xrCam.cameras[0] ?? xrCam;
      const P = eye.projectionMatrix.elements;
      const vp = (eye as PerspectiveCamera & { viewport?: { z: number; w: number } }).viewport;
      const width = vp && vp.z > 0 ? vp.z : 1440;
      const height = vp && vp.w > 0 ? vp.w : 1600;
      const fovY = (2 * Math.atan(1 / P[5]) * 180) / Math.PI;
      const far = P[10] + 1 !== 0 ? P[14] / (P[10] + 1) : Infinity;
      // eye pose in the dolly's frame, carried by the dolly's current orientation
      eye.matrix.decompose(this._p, this.viewQuat, this._s);
      this.viewQuat.premultiply(this.rig.quaternion);
      return { quat: this.viewQuat, fovY, aspect: width / height, width, height, pixelAngle: 2 / (P[5] * height),
        pixelRatio: 1, far: far > 0 ? far : Infinity, xr: true };
    }
    this.camera.getWorldQuaternion(this.viewQuat);
    return { quat: this.viewQuat, fovY: this.camera.fov, aspect: this.camera.aspect, width: this.width / this.pixelRatio,
      height: this.height / this.pixelRatio, pixelAngle: this.pixelAngle(), pixelRatio: this.pixelRatio, far: Infinity, xr: false };
  }
  private warnedXrTarget = false;
  private _p = new Vector3();
  private _s = new Vector3();

  render(): void {
    const gl = this.gl;
    if (this.presenting) {
      // three binds the headset's framebuffer (an XR render target backed by the session's
      // projection layer) before every XR frame: draw into that, never into the page canvas.
      const target = gl.getRenderTarget();
      if (!target || !(target as WebGLRenderTarget & { isXRRenderTarget?: boolean }).isXRRenderTarget) {
        if (!this.warnedXrTarget) console.warn('XR frame without the XR render target bound', target);
        this.warnedXrTarget = true;
      }
      gl.setClearColor(0x000000, 1);
      gl.clear(true, true, true);
      gl.render(this.scene, this.camera);
      return;
    }
    gl.setRenderTarget(this.hdr);
    gl.setClearColor(0x000000, 1);
    gl.clear(true, true, true);
    gl.render(this.scene, this.camera);

    // Bloom: progressive downsample of the full HDR image, then tent upsample-accumulate.
    let src = this.hdr.texture;
    let sw = this.width, sh = this.height;
    this.quad.material = this.downMat;
    for (const t of this.bloomTargets) {
      this.downMat.uniforms.tSrc.value = src;
      this.downMat.uniforms.uTexel.value.set(1 / sw, 1 / sh);
      gl.setRenderTarget(t);
      gl.render(this.quadScene, this.quadCam);
      src = t.texture;
      sw = t.width; sh = t.height;
    }
    this.quad.material = this.upMat;
    for (let i = this.bloomTargets.length - 1; i > 0; i--) {
      const from = this.bloomTargets[i];
      const to = this.bloomTargets[i - 1];
      this.upMat.uniforms.tSrc.value = from.texture;
      this.upMat.uniforms.tPrev.value = to.texture;
      this.upMat.uniforms.uTexel.value.set(1 / from.width, 1 / from.height);
      // Accumulate into a ping-pong: render to `to` is not allowed while sampling it, so use src target swap.
      gl.setRenderTarget(this.scratch(to));
      gl.render(this.quadScene, this.quadCam);
      this.swapScratch(i - 1);
    }

    this.quad.material = this.compositeMat;
    this.compositeMat.uniforms.tScene.value = this.hdr.texture;
    this.compositeMat.uniforms.tBloom.value = this.bloomTargets[0]?.texture ?? this.hdr.texture;
    this.compositeMat.uniforms.uExposure.value = this.postExposure;
    this.compositeMat.uniforms.uBloom.value = this.bloomTargets.length ? this.bloomStrength : 0;
    gl.setRenderTarget(null);
    gl.render(this.quadScene, this.quadCam);
  }

  // Ping-pong helpers for the upsample chain: each level keeps a twin target.
  private twins = new Map<WebGLRenderTarget, WebGLRenderTarget>();
  private scratch(t: WebGLRenderTarget): WebGLRenderTarget {
    let twin = this.twins.get(t);
    if (!twin || twin.width !== t.width || twin.height !== t.height) {
      twin?.dispose();
      twin = new WebGLRenderTarget(t.width, t.height, { type: HalfFloatType, depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
      this.twins.set(t, twin);
    }
    return twin;
  }
  private swapScratch(level: number): void {
    const t = this.bloomTargets[level];
    const twin = this.twins.get(t)!;
    this.twins.delete(t);
    this.twins.set(twin, t);
    this.bloomTargets[level] = twin;
  }

  screenshot(): string {
    return this.canvas.toDataURL('image/png');
  }
}
