import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function fibonacciPoints(count, radius) {
  const points = [];
  const golden = Math.PI * (1 + Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    );
  }
  return points;
}

function slerpOnSphere(from, to, t) {
  const a = from.clone().normalize();
  const b = to.clone().normalize();
  let dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  if (dot > 0.9995) {
    return a.lerp(b, t).normalize();
  }
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const out = new THREE.Vector3();
  out.addScaledVector(a, Math.sin((1 - t) * omega) / sinOmega);
  out.addScaledVector(b, Math.sin(t * omega) / sinOmega);
  return out;
}

function arcPoints(from, to, radius, segments) {
  const pts = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const p = slerpOnSphere(from, to, t);
    const lift = 1 + Math.sin(t * Math.PI) * 0.14;
    pts.push(p.multiplyScalar(radius * lift));
  }
  return pts;
}

export default function ContactGlobe() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0.15, 0.08, 6.05);

    const group = new THREE.Group();
    group.rotation.set(0.18, 0.55, 0);
    scene.add(group);

    const radius = 1.45;
    const sphereGeo = new THREE.SphereGeometry(radius, 40, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x18b19a,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    group.add(new THREE.Mesh(sphereGeo, sphereMat));

    const seeds = fibonacciPoints(56, radius);
    const nodePos = new Float32Array(seeds.length * 3);
    seeds.forEach((p, i) => {
      nodePos[i * 3] = p.x;
      nodePos[i * 3 + 1] = p.y;
      nodePos[i * 3 + 2] = p.z;
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.038,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
    });
    group.add(new THREE.Points(nodeGeo, nodeMat));

    const arcMat = new THREE.LineBasicMaterial({
      color: 0x18b19a,
      transparent: true,
      opacity: 0.62,
    });
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
    });
    const arcGeos = [];
    const pairCount = 20;
    for (let i = 0; i < pairCount; i += 1) {
      const a = seeds[i];
      const b = seeds[(i * 11 + 17) % seeds.length];
      const geo = new THREE.BufferGeometry().setFromPoints(arcPoints(a, b, radius, 30));
      arcGeos.push(geo);
      group.add(new THREE.Line(geo, i % 4 === 0 ? trailMat : arcMat));
    }

    const sizeToHost = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    sizeToHost();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sizeToHost) : null;
    ro?.observe(host);
    window.addEventListener('resize', sizeToHost);

    let frame = 0;
    let spin = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!reduceMotion) {
        spin += 0.0032;
        group.rotation.y = 0.55 + spin;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', sizeToHost);
      ro?.disconnect();
      sphereGeo.dispose();
      sphereMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      arcGeos.forEach((geo) => geo.dispose());
      arcMat.dispose();
      trailMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="cp-contact-globe" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} className="cp-contact-globe__canvas" />
    </div>
  );
}
