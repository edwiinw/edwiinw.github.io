import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

const canvas = document.getElementById("character-canvas");
const shell = document.querySelector("[data-character-shell]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && shell && "WebGLRenderingContext" in window) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.08, 5.5);

  const group = new THREE.Group();
  group.position.y = -0.06;
  scene.add(group);

  const texture = await new THREE.TextureLoader().loadAsync("assets/edwiin-character-cutout.png");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  const uniforms = {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uLight: { value: new THREE.Vector2(.2, .8) }
  };

  const figureMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform vec2 uPointer;
      varying vec2 vUv;
      varying float vRelief;

      void main() {
        vUv = uv;
        vec4 texel = texture2D(uTexture, uv);
        float luminance = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
        float silhouette = smoothstep(0.04, 0.7, texel.a);
        float center = max(0.0, 1.0 - distance(uv, vec2(0.5, 0.5)) * 1.8);
        float relief = silhouette * (0.035 + luminance * 0.12 + center * 0.04);
        relief += sin((uv.y * 8.0) + uTime * 0.45) * 0.004 * silhouette;
        vRelief = relief;

        vec3 displaced = position;
        displaced.z += relief;
        displaced.x += uPointer.x * (0.018 + relief * 0.08);
        displaced.y += uPointer.y * (0.012 + relief * 0.06);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform vec2 uLight;
      varying vec2 vUv;
      varying float vRelief;

      void main() {
        vec2 opticalShift = vec2(
          sin(vUv.y * 10.0 + uTime * 0.35),
          cos(vUv.x * 8.0 + uTime * 0.28)
        ) * 0.0015;
        opticalShift += uPointer * 0.0025 * (0.45 + vRelief);

        vec4 texel = texture2D(uTexture, vUv + opticalShift);
        float luminance = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));

        if (vUv.y < 0.17 && luminance < 0.58) discard;
        if (texel.a < 0.035) discard;

        float gloss = pow(max(0.0, 1.0 - distance(vUv, uLight)), 7.0);
        float rim = smoothstep(0.08, 0.42, texel.a) - smoothstep(0.42, 0.82, texel.a);
        vec3 cobalt = vec3(0.15, 0.43, 1.0);
        vec3 color = texel.rgb;
        color += gloss * vec3(0.2, 0.34, 0.5) * 0.2;
        color = mix(color, color + cobalt * 0.16, rim);

        gl_FragColor = vec4(color, texel.a);
      }
    `
  });

  const figureGeometry = new THREE.PlaneGeometry(2.72, 2.72, 72, 72);
  const figure = new THREE.Mesh(figureGeometry, figureMaterial);
  figure.position.z = 0.34;
  figure.renderOrder = 3;
  group.add(figure);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: new THREE.Color(0x315ea8),
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 2.76), shadowMaterial);
  shadow.position.set(0.04, -0.01, 0.08);
  shadow.renderOrder = 2;
  group.add(shadow);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x2d68ff),
    roughness: 0.08,
    metalness: 0.02,
    transmission: 0.92,
    thickness: 1.25,
    ior: 1.35,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.08
  });

  const glassForm = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.08, 5),
    glassMaterial
  );
  glassForm.scale.set(1.04, 1.2, 0.32);
  glassForm.position.set(0.08, 0.08, -0.5);
  glassForm.renderOrder = 1;
  group.add(glassForm);

  const ringMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x77a8ff),
    emissive: new THREE.Color(0x1458c7),
    emissiveIntensity: 0.45,
    roughness: 0.16,
    metalness: 0.05,
    transmission: 0.65,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.04, 0.01, 12, 150),
    ringMaterial
  );
  ring.position.z = -0.16;
  ring.renderOrder = 1;
  group.add(ring);

  scene.add(new THREE.AmbientLight(0x89a8e8, 1.5));
  const keyLight = new THREE.PointLight(0x8eb7ff, 18, 9);
  keyLight.position.set(2.2, 2.4, 3.2);
  scene.add(keyLight);
  const redBounce = new THREE.PointLight(0xff566b, 9, 7);
  redBounce.position.set(-2.4, -1.2, 2.2);
  scene.add(redBounce);

  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  let visible = true;

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const setPointer = (event) => {
    const rect = shell.getBoundingClientRect();
    pointerTarget.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerTarget.y = THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
  };

  if (!reducedMotion) {
    shell.addEventListener("pointermove", setPointer, { passive: true });
    shell.addEventListener("pointerleave", () => pointerTarget.set(0, 0));
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
  }

  new ResizeObserver(() => {
    resize();
    if (reducedMotion) renderer.render(scene, camera);
  }).observe(shell);
  resize();

  const render = () => {
    if (!reducedMotion) requestAnimationFrame(render);
    if (!visible) return;

    const elapsed = clock.getElapsedTime();
    pointer.lerp(pointerTarget, reducedMotion ? 1 : 0.065);
    uniforms.uTime.value = elapsed;
    uniforms.uPointer.value.copy(pointer);
    uniforms.uLight.value.set(0.5 + pointer.x * 0.24, 0.76 + pointer.y * 0.18);

    group.rotation.y = pointer.x * 0.18;
    group.rotation.x = -pointer.y * 0.11;
    group.position.x = pointer.x * 0.07;
    group.position.y = -0.06 + pointer.y * 0.045;

    if (!reducedMotion) {
      glassForm.rotation.y = elapsed * 0.08 + pointer.x * 0.28;
      glassForm.rotation.x = elapsed * 0.045 - pointer.y * 0.18;
      ring.rotation.z = elapsed * 0.035;
      figure.position.y = Math.sin(elapsed * 0.7) * 0.012;
    }

    keyLight.position.x = 2.2 + pointer.x * 1.4;
    keyLight.position.y = 2.4 + pointer.y * 1.1;
    renderer.render(scene, camera);
  };

  document.documentElement.classList.add("webgl-ready");
  document.querySelector(".character-fallback")?.setAttribute("aria-hidden", "true");
  render();
}
