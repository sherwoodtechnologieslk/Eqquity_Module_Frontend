import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PALETTES = {
  light: { bg: 0xf5f5f3, line: 0x0c7b74 },
  dark: { bg: 0x042824, line: 0x0c7b74 },
};

function modeFromHour(hour) {
  return hour < 6 || hour >= 18 ? 'dark' : 'light';
}

function TimeIcon({ mode }) {
  if (mode === 'dark') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M12.6 3.2a6.6 6.6 0 1 0 4.2 11.4 7.4 7.4 0 1 1-4.2-11.4Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.2v1.8M10 16v1.8M2.2 10h1.8M16 10h1.8M4.4 4.4l1.3 1.3M14.3 14.3l1.3 1.3M4.4 15.6l1.3-1.3M14.3 5.7l1.3-1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export default function SiteAtmosphere({ embedded = false, onDarkChange }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const modeRef = useRef(modeFromHour(new Date().getHours()));
  const [mode, setMode] = useState(() => modeRef.current);
  const isDark = mode === 'dark';

  useEffect(() => {
    modeRef.current = mode;
    onDarkChange?.(isDark);
  }, [mode, isDark, onDarkChange]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 3.6, 9.4);
    camera.lookAt(0, 0.2, -1.6);

    const palette = PALETTES[modeRef.current];
    const clear = new THREE.Color(palette.bg);
    const lineColor = new THREE.Color(palette.line);
    renderer.setClearColor(clear, 1);
    scene.fog = new THREE.Fog(clear, 7, 22);

    const geometry = new THREE.PlaneGeometry(28, 18, 72, 46);
    const positions = geometry.attributes.position;

    const applySurface = (time) => {
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z =
          Math.sin(x * 0.32 + time * 0.55) * 0.42 +
          Math.cos(y * 0.24 + time * 0.38) * 0.3 +
          Math.sin((x + y) * 0.16 + time * 0.22) * 0.5;
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    };
    applySurface(0);

    const material = new THREE.MeshBasicMaterial({
      color: lineColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const field = new THREE.Mesh(geometry, material);
    field.rotation.x = -Math.PI / 2.35;
    scene.add(field);

    let target = {
      bg: clear.clone(),
      line: lineColor.clone(),
    };
    let anim = 0;
    let frame = 0;
    let visible = true;

    const sizeToHost = () => {
      const { clientWidth, clientHeight } = host;
      const width = Math.max(clientWidth, 1);
      const height = Math.max(clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    sizeToHost();

    const onResize = () => sizeToHost();
    window.addEventListener('resize', onResize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(host);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;

      const next = PALETTES[modeRef.current];
      target.bg.setHex(next.bg);
      target.line.setHex(next.line);
      clear.lerp(target.bg, 0.06);
      lineColor.lerp(target.line, 0.06);
      renderer.setClearColor(clear, 1);
      scene.fog.color.copy(clear);
      material.color.copy(lineColor);

      if (!reduceMotion) {
        anim += 0.012;
        applySurface(anim);
        field.rotation.z = Math.sin(anim * 0.08) * 0.04;
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const Tag = embedded ? 'div' : 'section';
  return (
    <Tag
      className={`cp-site-viz${isDark ? ' cp-site-viz--dark' : ''}${embedded ? ' cp-site-viz--embed' : ''}`}
      ref={hostRef}
      style={{ background: `#${PALETTES[mode].bg.toString(16).padStart(6, '0')}` }}
      aria-label="Market atmosphere"
    >
      <canvas ref={canvasRef} className="cp-site-viz__canvas" aria-hidden="true" />
      <div className="cp-site-viz__controls">
        <button
          type="button"
          className="cp-site-viz__trigger"
          aria-pressed={isDark}
          aria-label={isDark ? 'Dark appearance. Switch to light' : 'Light appearance. Switch to dark'}
          onClick={() => setMode((value) => (value === 'dark' ? 'light' : 'dark'))}
        >
          <TimeIcon mode={mode} />
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </Tag>
  );
}
