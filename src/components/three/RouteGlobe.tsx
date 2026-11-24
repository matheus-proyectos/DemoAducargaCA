"use client";
/**
 * Globo 3D procedural de la ruta logística ADUCARGA (three.js + GSAP),
 * mismo stack que matheusgroupp.com / matheustechnology.com:
 *   three@0.187 · postprocesado UnrealBloom · GSAP para coreografía.
 *
 * - mode "hero":     animación en bucle — la ruta se dibuja y un paquete viaja
 *                    del casillero internacional a Venezuela y luego a su ciudad.
 * - mode "tracking": muestra la posición REAL del envío según su etapa (0–4).
 *
 * Rendimiento/accesibilidad: sin bloom y menos partículas en móvil, pausa fuera
 * de pantalla o en pestaña oculta, respeta prefers-reduced-motion y se omite
 * por completo si el navegador no soporta WebGL (queda el fondo CSS).
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import gsap from "gsap";

export type RouteGlobeProps = {
  mode?: "hero" | "tracking";
  /** 0 casillero · 1 tránsito · 2 Venezuela · 3 reparto · 4 entregado */
  stage?: number;
  destinationCity?: string;
  className?: string;
};

const ORIGIN: [number, number] = [25.8, -80.2]; // hub internacional (representativo)
const HUB: [number, number] = [10.6, -66.95]; // llegada a Venezuela (Maiquetía)
const CITIES: Record<string, [number, number]> = {
  caracas: [10.49, -66.88], valencia: [10.16, -68.0], maracaibo: [10.65, -71.64], barquisimeto: [10.07, -69.32],
  maracay: [10.25, -67.6], merida: [8.59, -71.14], "san cristobal": [7.77, -72.22], barcelona: [10.13, -64.69],
  "puerto ordaz": [8.29, -62.71], "ciudad guayana": [8.29, -62.71], maturin: [9.75, -63.18], cumana: [10.45, -64.17],
  "puerto la cruz": [10.21, -64.63], "porlamar": [10.96, -63.85], "san felipe": [10.34, -68.74], "coro": [11.4, -69.67],
};
const normCity = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function ll([lat, lon]: [number, number], r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
function arc(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1 + lift);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}
function cssColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const p = v.split(/\s+/).map(Number);
  // Los tokens CSS están en sRGB: se declaran como tales para que three.js no los aclare.
  return p.length === 3 && p.every((n) => !isNaN(n))
    ? new THREE.Color().setRGB(p[0] / 255, p[1] / 255, p[2] / 255, THREE.SRGBColorSpace)
    : new THREE.Color(fallback);
}
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const arcVS = `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const arcFS = `uniform vec3 uColor; uniform vec3 uDim; uniform float uDraw; uniform float uDone; varying float vU;
void main(){ if(vU > uDraw) discard; float done = step(vU, uDone); gl_FragColor = vec4(mix(uDim, uColor, done), mix(.45, 1., done)); }`;

export default function RouteGlobe({ mode = "hero", stage = 0, destinationCity, className }: RouteGlobeProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // sin WebGL: se mantiene el fondo CSS
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = matchMedia("(max-width: 767px)").matches;
    const hero = mode === "hero";

    const cBg = cssColor("--brand-dark", "#071B34");
    const cBrand = cssColor("--brand", "#0C2C52");
    const cSoft = cssColor("--brand-soft", "#E8EFF7");
    const cAccent = cssColor("--accent", "#F29F05");

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setClearColor(cBg, 1);
    // Sin tone mapping: el fondo coincide exactamente con el color de marca del sitio.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    const root = new THREE.Group(); // posición en pantalla
    const globe = new THREE.Group(); // rotación
    root.add(globe);
    scene.add(root);
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o);

    // ── Núcleo (oculta los puntos traseros) ──
    const core = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.985, 64, 64)),
      track(new THREE.MeshBasicMaterial({ color: cBg.clone().lerp(cBrand, 0.55) })),
    );
    globe.add(core);

    // ── Puntos del globo (esfera de Fibonacci) ──
    const N = mobile ? 2200 : 4200;
    const pos = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r], i * 3);
    }
    const dotsGeo = track(new THREE.BufferGeometry());
    dotsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    globe.add(new THREE.Points(dotsGeo, track(new THREE.PointsMaterial({
      color: cSoft, size: mobile ? 0.014 : 0.011, transparent: true, opacity: 0.5, depthWrite: false,
    }))));

    // ── Paralelos ──
    const ringMat = track(new THREE.LineBasicMaterial({ color: cSoft, transparent: true, opacity: 0.08 }));
    for (const lat of [-60, -30, 0, 30, 60]) {
      const pts = Array.from({ length: 129 }, (_, i) => ll([lat, (i / 128) * 360 - 180], 1.001));
      globe.add(new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), ringMat));
    }

    // ── Atmósfera (fresnel) ──
    globe.add(new THREE.Mesh(
      track(new THREE.SphereGeometry(1.14, 64, 64)),
      track(new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0x5b9bd5).lerp(cSoft, 0.2) } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        // Halo solo en el contorno: 0 en el centro del disco, máximo en el limbo.
        fragmentShader: `uniform vec3 uColor; varying vec3 vN; void main(){ float i = pow(1. - abs(dot(vN, vec3(0.,0.,1.))), 3.) * .55; gl_FragColor = vec4(uColor * i, i); }`,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      })),
    ));

    // ── Rutas ──
    const A = ll(ORIGIN), B = ll(HUB);
    const destLL = CITIES[normCity(destinationCity)] ?? CITIES.valencia;
    const D = ll(destLL);
    const intl = arc(A, B, 0.32);
    const national = A.distanceTo(D) > 0 && B.distanceTo(D) > 0.006 ? arc(B, D, 0.06) : null;

    const makeArc = (curve: THREE.Curve<THREE.Vector3>, radius: number) => {
      const mat = track(new THREE.ShaderMaterial({
        uniforms: { uColor: { value: cAccent }, uDim: { value: cSoft }, uDraw: { value: 0 }, uDone: { value: 0 } },
        vertexShader: arcVS, fragmentShader: arcFS, transparent: true, depthWrite: false,
      }));
      globe.add(new THREE.Mesh(track(new THREE.TubeGeometry(curve, 96, radius, 8, false)), mat));
      return mat.uniforms as { uDraw: { value: number }; uDone: { value: number } };
    };
    const uIntl = makeArc(intl, mobile ? 0.006 : 0.0045);
    const uNat = national ? makeArc(national, 0.0035) : null;

    // Ciudades secundarias de reparto (ambientales)
    const otherArcs = hero
      ? ["maracaibo", "barquisimeto", "puerto ordaz", "san cristobal", "barcelona"].map((c) => makeArc(arc(B, ll(CITIES[c]), 0.05), 0.0025))
      : [];

    // ── Pines ──
    const glowTex = track(glowTexture());
    const pin = (p: THREE.Vector3, size: number, color: THREE.Color) => {
      const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      s.position.copy(p.clone().multiplyScalar(1.004));
      s.scale.setScalar(size);
      globe.add(s);
      return s;
    };
    pin(A, 0.09, cSoft);
    const pinB = pin(B, 0.12, cAccent);
    const pinD = national ? pin(D, 0.07, cSoft) : null;

    // ── Paquete ──
    const pkg = new THREE.Group();
    const box = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.034, 0.034, 0.034)),
      track(new THREE.MeshBasicMaterial({ color: cAccent.clone().multiplyScalar(1.4) })),
    );
    const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, color: cAccent, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    halo.scale.setScalar(0.2);
    pkg.add(box, halo);
    globe.add(pkg);

    // Orienta el globo para que la ruta mire a la cámara.
    const focus = intl.getPoint(0.55).normalize();
    const baseQ = new THREE.Quaternion().setFromUnitVectors(focus, new THREE.Vector3(0, hero ? 0.12 : 0.05, 1).normalize());
    globe.quaternion.copy(baseQ);

    // ── Estado animable ──
    const st = { draw: 0, natDraw: 0, t: 0, onNat: 0, pkgVis: 0, others: 0 };
    const placePackage = () => {
      const curve = st.onNat && national ? national : intl;
      const t = st.onNat && !national ? 1 : st.t;
      const p = curve.getPoint(t);
      pkg.position.copy(p);
      pkg.lookAt(curve.getPoint(Math.min(1, t + 0.01)));
      box.rotation.z += 0.01;
      pkg.scale.setScalar(st.pkgVis);
    };

    let tl: gsap.core.Timeline | null = null;
    if (hero) {
      if (reduced) Object.assign(st, { draw: 1, natDraw: 1, t: 0.62, pkgVis: 1, others: 1 });
      else {
        tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
        tl.set(st, { draw: 0, natDraw: 0, t: 0, onNat: 0, pkgVis: 0 })
          .to(st, { others: 1, duration: 1.6, ease: "power2.out" }, 0)
          .to(st, { draw: 1, duration: 1.3, ease: "power2.inOut" }, 0.2)
          .to(st, { pkgVis: 1, duration: 0.4, ease: "back.out(2)" }, 1.1)
          .to(st, { t: 1, duration: 3.2, ease: "power1.inOut" }, 1.2)
          .to(pinB.scale, { x: 0.22, y: 0.22, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" }, 4.35)
          .set(st, { onNat: 1, t: 0 }, 4.4)
          .to(st, { natDraw: 1, duration: 0.7, ease: "power2.out" }, 4.4)
          .to(st, { t: 1, duration: 1.4, ease: "power1.inOut" }, 4.6)
          .to(st, { pkgVis: 0, duration: 0.35 }, 6.2)
          .to(st, { draw: 0, natDraw: 0, duration: 0.6, ease: "power2.in" }, 6.4);
      }
    } else {
      // Tracking: posición real según etapa.
      const s = Math.max(0, Math.min(4, Math.round(stage)));
      const targets = [
        { done: 0, t: 0, onNat: 0, nat: 0 },
        { done: 0.55, t: 0.55, onNat: 0, nat: 0 },
        { done: 1, t: 1, onNat: 0, nat: 0 },
        { done: 1, t: 0.5, onNat: 1, nat: 0.5 },
        { done: 1, t: 1, onNat: 1, nat: 1 },
      ][s];
      Object.assign(st, { draw: 1, natDraw: 1, onNat: targets.onNat, pkgVis: 1 });
      uIntl.uDone.value = 0;
      if (uNat) uNat.uDone.value = 0;
      if (reduced) {
        st.t = targets.t;
        uIntl.uDone.value = targets.done;
        if (uNat) uNat.uDone.value = targets.nat;
      } else {
        tl = gsap.timeline({ delay: 0.3 });
        tl.fromTo(st, { t: 0 }, { t: targets.onNat ? 1 : targets.t, duration: 1.6, ease: "power2.inOut" })
          .to(uIntl.uDone, { value: targets.done, duration: 1.6, ease: "power2.inOut" }, 0);
        st.onNat = 0;
        if (targets.onNat) {
          tl.set(st, { onNat: 1, t: 0 })
            .to(st, { t: targets.t, duration: 1, ease: "power2.out" })
            .to(uNat!.uDone, { value: targets.nat, duration: 1, ease: "power2.out" }, "<");
        }
      }
    }

    // ── Composición (bloom solo en escritorio) ──
    let composer: EffectComposer | null = null;
    if (!mobile) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.45, 0.55));
      composer.addPass(new OutputPass());
    }

    // ── Layout responsivo ──
    const layout = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      const aspect = w / h;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = aspect;
      if (hero) {
        if (aspect > 1.15) { camera.position.set(0, 0, 3.6); root.position.set(Math.min(1.05, aspect * 0.5), 0, 0); root.scale.setScalar(0.82); }
        else { camera.position.set(0, 0, 3.9); root.position.set(0, -1.15, 0); root.scale.setScalar(0.95); }
      } else {
        camera.position.set(0, 0, aspect > 1.6 ? 2.4 : 2.8);
        root.position.set(aspect > 1.6 ? 0.6 : 0.25, aspect > 1.6 ? -0.05 : -0.45, 0);
        root.scale.setScalar(1);
      }
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    layout();

    // ── Interacción (parallax suave) ──
    const look = { x: 0, y: 0 };
    const qx = gsap.quickTo(look, "x", { duration: 1.2, ease: "power3.out" });
    const qy = gsap.quickTo(look, "y", { duration: 1.2, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      qx((e.clientX / window.innerWidth - 0.5) * 0.35);
      qy((e.clientY / window.innerHeight - 0.5) * 0.2);
    };
    if (!reduced && !mobile) window.addEventListener("pointermove", onMove, { passive: true });

    // ── Bucle de render con pausa fuera de pantalla ──
    let visible = true, raf = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0 });
    io.observe(el);
    const qTmp = new THREE.Quaternion(), eTmp = new THREE.Euler();
    const clock = new THREE.Clock();
    const frame = () => {
      const time = clock.getElapsedTime();
      uIntl.uDraw.value = st.draw;
      if (uNat) uNat.uDraw.value = st.natDraw;
      otherArcs.forEach((u, i) => (u.uDraw.value = Math.max(0, Math.min(1, st.others * 1.4 - i * 0.08))));
      if (hero) uIntl.uDone.value = st.onNat ? 1 : st.t;
      if (hero && uNat) uNat.uDone.value = st.onNat ? st.t : 0;
      placePackage();
      halo.material.opacity = 0.75 + Math.sin(time * 4) * 0.25;
      if (pinD) pinD.material.opacity = 0.6 + Math.sin(time * 2.5) * 0.3;
      const sway = reduced ? 0 : Math.sin(time * 0.15) * 0.12;
      eTmp.set(look.y, look.x + sway, 0);
      globe.quaternion.copy(qTmp.setFromEuler(eTmp).multiply(baseQ));
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    const loop = () => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      frame();
      if (!reduced || !hero) raf = requestAnimationFrame(loop);
    };
    const onVis = () => !document.hidden && loop();
    document.addEventListener("visibilitychange", onVis);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      tl?.kill();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose());
      composer?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, stage, destinationCity]);

  return <div ref={host} className={className} />;
}
