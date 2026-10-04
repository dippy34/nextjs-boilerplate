import {
  AdditiveBlending, CustomToneMapping, DepthTexture, FloatType, Group, HalfFloatType, LinearFilter, Mesh, NoBlending, NoToneMapping,
  type Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Quaternion, RGBAFormat, Scene, ShaderMaterial, Vector2,
  Vector3, WebGLCoordinateSystem, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { installToneMapping, TONE_GLSL } from './shaders/tone';
import { Governor, QUALITY, RENDER_SCALE, XR_VOLUME_FACTOR } from './Quality';
import { OUTPUT_FRAGMENT } from './shaders/xr';

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

/**
 * Volumes (ray-marched nebulae, and any layer that adds glowing gas) drawn in a pass of their own at
 * reduced resolution, then added to the frame before the rest of the scene. A full-screen volume
 * marched per pixel is the heaviest thing the renderer draws (inside a nebula: every pixel of both
 * eyes); at half resolution it costs a quarter, and volumes are soft enough to upsample. They are
 * additive and never write depth, and everything opaque drawn afterwards still covers them, so
 * the result matches drawing them in the scene. Meshes go on `layer` only (the main camera does
 * not see it) and into `meshes`; `scale` 1 draws them in the main pass instead.
 */
export const VOLUMES = {
  layer: 4,
  meshes: new Set<Object3D>(),
  /** desktop: three quarters keeps a remnant's finest filaments (half resolution softens them) */
  scale: 0.75,
  /** headset: half (the cost there is two eyes of full-screen marching) */
  scaleXr: 0.5,
};

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
  private volTarget: WebGLRenderTarget | null = null;
  /**
   * The volume pass added to the frame: a full-screen quad in the scene, drawn where the volumes
   * were (transparent, renderOrder -1: after everything opaque, sky included) at the far plane, so
   * that whatever opaque lies in front still covers it (also in a headset, with no depth to read)
   */
  private volMat = new ShaderMaterial({
    vertexShader: /* glsl */ `
      uniform float uFarZ;
      void main() { gl_Position = vec4(position.xy, uFarZ, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tVol; uniform vec2 uInvFb;
      void main() {
        gl_FragColor = vec4(texture2D(tVol, gl_FragCoord.xy * uInvFb).rgb, 1.0);
${OUTPUT_FRAGMENT}
      }`,
    uniforms: { tVol: { value: null }, uInvFb: { value: new Vector2(1, 1) }, uFarZ: { value: 1 } },
    transparent: true, depthTest: true, depthWrite: false, blending: AdditiveBlending,
  });
  private volQuad = new Mesh(new PlaneGeometry(2, 2), this.volMat);
  private quadScene = new Scene();
  private quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private downMat: ShaderMaterial;
  private upMat: ShaderMaterial;
  private compositeMat: ShaderMaterial;
  width = 1;
  height = 1;
  pixelRatio = 1;
  /** internal render resolution relative to the canvas (the quality governor's desktop knob) */
  renderScale = 1;
  private cssW = 1;
  private cssH = 1;
  readonly governor = new Governor(Governor.wanted());

  /** dolly carrying the camera (and VR controllers); its orientation is the explorer's orientation */
  readonly rig = new Group();

  constructor(readonly canvas: HTMLCanvasElement, readonly xrCapable = false) {
    installToneMapping();
    // a headset uses logarithmic depth unless asked for reversed-Z (?xrdepth=reversed): log depth
    // writes the fragment depth, which turns off early depth rejection (see reverseXrProjections)
    const xrReversed = xrCapable && new URLSearchParams(location.search).get('xrdepth') === 'reversed';
    const reversed = (!xrCapable || xrReversed) && Renderer.supportsClipControl();
    this.depthMode = reversed ? 'reversed-z' : 'logarithmic';
    if (xrReversed) console.info(`xrdepth=reversed: ${reversed ? 'reversed-Z depth (EXT_clip_control)' : 'EXT_clip_control unavailable, logarithmic depth'}`);
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
          // (clamped: the sum of the levels can exceed half-float range and turn into infinity)
          gl_FragColor = vec4(min(s / 16.0 + texture2D(tPrev, vUv).rgb, vec3(6.0e4)), 1.0);
        }`,
      uniforms: { tSrc: { value: null }, tPrev: { value: null }, uTexel: { value: new Vector2() }, uRadius: { value: 1 } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.compositeMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uExposure; uniform float uBloom; varying vec2 vUv;
        ${TONE_GLSL}
        vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec3 hdr = min(texture2D(tScene, vUv).rgb, vec3(6.0e4)) + uBloom * min(texture2D(tBloom, vUv).rgb, vec3(6.0e4));
          vec3 c = toSRGB(spTone(hdr * uExposure));
          c += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither
          gl_FragColor = vec4(c, 1.0);
        }`,
      uniforms: { tScene: { value: null }, tBloom: { value: null }, uExposure: { value: 1 }, uBloom: { value: 0.05 } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.compositeMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
    this.volQuad.frustumCulled = false;
    this.volQuad.renderOrder = -1;
    this.volQuad.visible = false;
    this.volQuad.name = 'volume pass';
    // far plane: NDC depth 0 with reversed-Z, 1 otherwise
    this.volMat.uniforms.uFarZ.value = this.depthMode === 'reversed-z' ? 0 : 1;
    this.scene.add(this.volQuad);
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
    this.cssW = cssWidth;
    this.cssH = cssHeight;
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(cssWidth, cssHeight, false);
    this.allocate();
  }

  /** the internal render targets at the canvas size times `renderScale` (the composite upscales) */
  private allocate(): void {
    const w = Math.max(1, Math.floor(this.cssW * this.pixelRatio * this.renderScale));
    const h = Math.max(1, Math.floor(this.cssH * this.pixelRatio * this.renderScale));
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
    this.gl.toneMapping = on ? CustomToneMapping : NoToneMapping;
    this.gl.toneMappingExposure = 1;
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
    // (render pixels per CSS pixel: the device's ratio times the internal resolution scale)
    const ratio = this.pixelRatio * this.renderScale;
    return { quat: this.viewQuat, fovY: this.camera.fov, aspect: this.camera.aspect, width: this.width / ratio,
      height: this.height / ratio, pixelAngle: this.pixelAngle(), pixelRatio: ratio, far: Infinity, xr: false };
  }
  /**
   * Run `fn` (shader compilation ahead of time) with the scene's render target bound: three builds
   * a program per output target (the linear HDR target or the page canvas), so compiling while the
   * canvas is bound would leave the variant actually drawn to compile on first use.
   */
  withSceneTarget<T>(fn: () => T): T {
    if (this.presenting) return fn();
    const was = this.gl.getRenderTarget();
    this.gl.setRenderTarget(this.hdr);
    try { return fn(); } finally { this.gl.setRenderTarget(was); }
  }

  /** The quality level changed (Quality.ts): a desktop renders at a scaled internal resolution. */
  private applyQuality(): void {
    const scale = RENDER_SCALE[QUALITY.level];
    console.info(`quality level ${QUALITY.level}${this.presenting ? ' (headset)' : `: render scale ${scale}`}`);
    if (!this.presenting && scale !== this.renderScale) {
      this.renderScale = scale;
      this.allocate();
    }
  }

  /**
   * The volume layer at `scale` of the frame (`fbW` x `fbH` pixels) into its own target, for adding
   * to the frame first (see VOLUMES). False when nothing is to be added: no volume visible, or
   * `scale` 1, when the main camera draws the layer itself.
   */
  private volumePass(fbW: number, fbH: number, scale: number): boolean {
    const L = VOLUMES.layer;
    if (scale >= 1) { this.camera.layers.enable(L); return false; }
    this.camera.layers.disable(L);
    let any = false;
    for (const m of VOLUMES.meshes) if (m.visible && m.parent?.visible !== false) { any = true; break; }
    if (!any) return false;
    const w = Math.max(1, Math.round(fbW * scale)), h = Math.max(1, Math.round(fbH * scale));
    if (!this.volTarget) {
      this.volTarget = new WebGLRenderTarget(w, h, { type: HalfFloatType, depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
    } else if (this.volTarget.width !== w || this.volTarget.height !== h) this.volTarget.setSize(w, h);
    const gl = this.gl;
    gl.setRenderTarget(this.volTarget);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, false, false);
    const mask = this.camera.layers.mask;
    this.camera.layers.set(L);
    // a headset: both eyes into the smaller target, their viewports scaled to it (three copies the
    // camera's layers to the eye cameras only when it updates them itself)
    const xc = this.presenting ? this.gl.xr.getCamera() : null;
    const saved = xc ? [xc, ...xc.cameras].map((c) => c.layers.mask) : [];
    if (xc) {
      xc.layers.mask = (1 << L) | 0b110;
      xc.cameras.forEach((c, i) => { c.layers.mask = xc.layers.mask & ~(i === 0 ? 0b100 : 0b010); c.viewport?.multiplyScalar(scale); });
    }
    try {
      gl.render(this.scene, this.camera);
    } finally {
      this.camera.layers.mask = mask;
      if (xc) {
        [xc, ...xc.cameras].forEach((c, i) => { c.layers.mask = saved[i]; });
        for (const c of xc.cameras) c.viewport?.multiplyScalar(1 / scale);
      }
    }
    this.volMat.uniforms.tVol.value = this.volTarget.texture;
    (this.volMat.uniforms.uInvFb.value as Vector2).set(1 / fbW, 1 / fbH);
    return true;
  }

  /**
   * Reversed-Z in a headset (?xrdepth=reversed): three copies each view's projection from the
   * runtime as is (OpenGL depth, finite far plane) and has no reversed-Z path for XR cameras. So
   * the XR camera is updated here, then each eye's projection (and the combined one used for
   * culling) is rebuilt as reversed-Z with the runtime's frustum edges and near plane and the
   * desktop camera's far plane, and marked reversed so three does not rebuild it from fov and
   * aspect. No pull-in is needed (App: uPullIn 0): depth no longer depends on the runtime's far.
   */
  private reverseXrProjections(): void {
    const xr = this.gl.xr;
    xr.cameraAutoUpdate = false;
    xr.updateCamera(this.camera);
    const xc = xr.getCamera();
    const far = this.camera.far;
    for (const c of [...xc.cameras, xc]) {
      const e = c.projectionMatrix.elements;
      // OpenGL form only (z row: -(f+n)/(f-n) ~ -1); a matrix already rebuilt is left alone
      if (!(e[10] < -0.5)) continue;
      const n = c.near;
      const l = (n * (e[8] - 1)) / e[0], r = (n * (e[8] + 1)) / e[0];
      const b = (n * (e[9] - 1)) / e[5], t = (n * (e[9] + 1)) / e[5];
      c.projectionMatrix.makePerspective(l, r, t, b, n, far, WebGLCoordinateSystem, true);
      c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
      (c as unknown as { _reversedDepth: boolean })._reversedDepth = true;
    }
  }

  private warnedXrTarget = false;
  private _p = new Vector3();
  private _s = new Vector3();

  render(): void {
    const gl = this.gl;
    // adaptive quality: budget 60 Hz on a desktop, the session's rate in a headset
    const budget = this.presenting ? 1000 / ((gl.xr.getSession() as (XRSession & { frameRate?: number }) | null)?.frameRate || 72) : 1000 / 60;
    if (this.governor.update(performance.now(), budget)) this.applyQuality();
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
      if (this.depthMode === 'reversed-z') this.reverseXrProjections();
      const xrTarget = gl.getRenderTarget();
      this.volQuad.visible = xrTarget ? this.volumePass(xrTarget.width, xrTarget.height, VOLUMES.scaleXr * XR_VOLUME_FACTOR[QUALITY.level]) : false;
      gl.setRenderTarget(xrTarget);
      gl.render(this.scene, this.camera);
      return;
    }
    this.volQuad.visible = this.volumePass(this.width, this.height, VOLUMES.scale);
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
