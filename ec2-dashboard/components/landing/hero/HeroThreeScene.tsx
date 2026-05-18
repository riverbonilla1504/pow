'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GREEN = 0x42b883;
const GREEN_LIGHT = 0x5cdb95;
const CONNECT_DIST = 7.5;
const INNER_VOID = 7;
const OUTER_RADIUS = 28;

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  accent: 'green' | 'neutral';
};

function spawnParticle(): Particle {
  const angle = Math.random() * Math.PI * 2;
  const radius = INNER_VOID + Math.random() * (OUTER_RADIUS - INNER_VOID);
  const accentRoll = Math.random();
  return {
    x: Math.cos(angle) * radius * (0.85 + Math.random() * 0.3),
    y: (Math.random() - 0.5) * 14,
    z: Math.sin(angle) * radius * 0.45 * (0.8 + Math.random() * 0.35),
    vx: (Math.random() - 0.5) * 0.008,
    vy: (Math.random() - 0.5) * 0.006,
    vz: (Math.random() - 0.5) * 0.005,
    accent: accentRoll > 0.45 ? 'green' : 'neutral',
  };
}

type SceneTheme = 'light' | 'dark';

function readSceneTheme(): SceneTheme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function particleColor(accent: Particle['accent'], theme: SceneTheme): THREE.Color {
  if (accent === 'green') return new THREE.Color(GREEN_LIGHT);
  return new THREE.Color(theme === 'light' ? 0x94a3b8 : 0x64748b);
}

export default function HeroThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 38 : 62;
    const maxLineVerts = particleCount * 16;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    camera.position.set(0, 0, 36);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const particles: Particle[] = Array.from({ length: particleCount }, spawnParticle);

    const pointGeo = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(particleCount * 3);
    const pointColors = new Float32Array(particleCount * 3);
    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeo.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const pointMat = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(pointGeo, pointMat));

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxLineVerts * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: GREEN_LIGHT,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(13, 0.025, 6, 80),
      new THREE.MeshBasicMaterial({
        color: GREEN,
        transparent: true,
        opacity: 0.09,
        wireframe: false,
      }),
    );
    halo.rotation.x = Math.PI * 0.42;
    scene.add(halo);

    let sceneTheme = readSceneTheme();
    const applySceneTheme = (theme: SceneTheme) => {
      const light = theme === 'light';
      pointMat.opacity = light ? 0.55 : 0.72;
      lineMat.opacity = light ? 0.08 : 0.11;
      (halo.material as THREE.MeshBasicMaterial).opacity = light ? 0.06 : 0.09;
    };
    applySceneTheme(sceneTheme);

    const themeObserver = new MutationObserver(() => {
      const next = readSceneTheme();
      if (next === sceneTheme) return;
      sceneTheme = next;
      applySceneTheme(sceneTheme);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    let targetMouseX = 0;
    let targetMouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        const planar = Math.sqrt(p.x * p.x + p.z * p.z);
        if (planar < INNER_VOID) {
          const push = INNER_VOID / Math.max(planar, 0.001);
          p.x *= push;
          p.z *= push;
        }
        if (planar > OUTER_RADIUS) {
          p.vx *= -1;
          p.vz *= -1;
        }
        if (Math.abs(p.y) > 10) p.vy *= -1;

        pointPositions[i * 3] = p.x;
        pointPositions[i * 3 + 1] = p.y;
        pointPositions[i * 3 + 2] = p.z;

        const c = particleColor(p.accent, sceneTheme);
        pointColors[i * 3] = c.r;
        pointColors[i * 3 + 1] = c.g;
        pointColors[i * 3 + 2] = c.b;
      }
      pointGeo.attributes.position.needsUpdate = true;
      pointGeo.attributes.color.needsUpdate = true;

      let seg = 0;
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dz = particles[i].z - particles[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > CONNECT_DIST) continue;
          if (seg >= maxLineVerts - 1) break;

          const midX = (particles[i].x + particles[j].x) * 0.5;
          const midZ = (particles[i].z + particles[j].z) * 0.5;
          if (Math.sqrt(midX * midX + midZ * midZ) < INNER_VOID * 0.75) continue;

          const i3 = seg * 3;
          linePositions[i3] = particles[i].x;
          linePositions[i3 + 1] = particles[i].y;
          linePositions[i3 + 2] = particles[i].z;
          linePositions[i3 + 3] = particles[j].x;
          linePositions[i3 + 4] = particles[j].y;
          linePositions[i3 + 5] = particles[j].z;
          seg += 2;
        }
      }
      lineGeo.setDrawRange(0, seg);
      lineGeo.attributes.position.needsUpdate = true;

      halo.rotation.z += 0.0012;
      halo.rotation.y += 0.0008;

      camera.position.x += (targetMouseX * 0.9 - camera.position.x) * 0.025;
      camera.position.y += (-targetMouseY * 0.45 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
      pointGeo.dispose();
      pointMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      halo.geometry.dispose();
      (halo.material as THREE.Material).dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-three-canvas" />;
}
