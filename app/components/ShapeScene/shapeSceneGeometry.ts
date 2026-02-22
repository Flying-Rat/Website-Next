import * as THREE from "three";

export const EASTER_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];
export const EASTER_SET = new Set(EASTER_SEQUENCE);

export interface ShapeData {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments | null;
  rotationSpeed: THREE.Vector3;
  floatOffset: number;
  floatSpeed: number;
  basePosition: THREE.Vector3;
  scale: number;
  hoverStrength: number;
  color: THREE.Color;
  aura?: THREE.Sprite;
  baseColor?: THREE.Color;
  hoverColor?: THREE.Color;
}

export interface ParticleData {
  basePosition: THREE.Vector3;
  phase: number;
}

export type ShapeType = "box" | "octahedron" | "tetrahedron" | "torus";

function toFlatNormals(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const flat = geo.getIndex() ? geo.toNonIndexed() : geo.clone();
  flat.computeVertexNormals();
  geo.dispose();
  return flat;
}

function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = radius - eps;

  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: segments,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: segments,
  });

  geometry.center();
  return geometry;
}

export function createShapeGeometry(
  type: ShapeType,
  size: number,
  wireframe: boolean,
  subdivisions: number,
): THREE.BufferGeometry {
  const isMobileSub = subdivisions <= 6;
  switch (type) {
    case "octahedron": {
      const geo = new THREE.OctahedronGeometry(size * 0.62, wireframe ? 0 : isMobileSub ? 1 : 2);
      return wireframe ? geo : toFlatNormals(geo);
    }
    case "tetrahedron": {
      const geo = new THREE.TetrahedronGeometry(size * 0.72, wireframe ? 0 : isMobileSub ? 1 : 2);
      return wireframe ? geo : toFlatNormals(geo);
    }
    case "torus":
      return new THREE.TorusGeometry(
        size * 0.38,
        size * 0.13,
        wireframe ? 6 : isMobileSub ? 7 : 9,
        wireframe ? 12 : isMobileSub ? 16 : 22,
      );
    default:
      return wireframe
        ? createRoundedBoxGeometry(size, size, size, size * 0.08, 2)
        : new THREE.BoxGeometry(size, size, size, subdivisions, subdivisions, subdivisions);
  }
}

export function edgeCreaseAngle(type: ShapeType): number {
  if (type === "tetrahedron") {
    return 20;
  }
  if (type === "octahedron") {
    return 30;
  }
  if (type === "torus") {
    return 15;
  }
  return 40;
}
