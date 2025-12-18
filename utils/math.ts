import * as THREE from 'three';

/**
 * Distributes N points on a sphere.
 * Uses specific geometric shapes for small N for better symmetry,
 * and Fibonacci Sphere Algorithm for N > 6.
 * Returns an array of {phi, theta} for each point index.
 */
export const distributePointsOnSphere = (count: number) => {
  const points: { phi: number; theta: number }[] = [];

  // Special geometric cases for small counts
  if (count === 1) {
    points.push({ phi: 0, theta: 0 }); // Top
  } else if (count === 2) {
    points.push({ phi: 0, theta: 0 }); // Top
    points.push({ phi: Math.PI, theta: 0 }); // Bottom
  } else if (count === 3) {
    // Equilateral triangle on equator
    points.push({ phi: Math.PI / 2, theta: 0 });
    points.push({ phi: Math.PI / 2, theta: (2 * Math.PI) / 3 });
    points.push({ phi: Math.PI / 2, theta: (4 * Math.PI) / 3 });
  } else if (count === 4) {
    // Tetrahedron
    // 1 Top, 3 Bottom Triangle
    const tetrahedralAngle = Math.acos(-1 / 3); // approx 109.47 degrees
    points.push({ phi: 0, theta: 0 }); // Top
    points.push({ phi: tetrahedralAngle, theta: 0 });
    points.push({ phi: tetrahedralAngle, theta: (2 * Math.PI) / 3 });
    points.push({ phi: tetrahedralAngle, theta: (4 * Math.PI) / 3 });
  } else if (count === 5) {
    // Triangular Bipyramid (Top, Bottom, 3 Equator)
    points.push({ phi: 0, theta: 0 }); // Top
    points.push({ phi: Math.PI, theta: 0 }); // Bottom
    points.push({ phi: Math.PI / 2, theta: 0 });
    points.push({ phi: Math.PI / 2, theta: (2 * Math.PI) / 3 });
    points.push({ phi: Math.PI / 2, theta: (4 * Math.PI) / 3 });
  } else if (count === 6) {
    // Octahedron (Top, Bottom, 4 Equator)
    points.push({ phi: 0, theta: 0 }); // Top
    points.push({ phi: Math.PI, theta: 0 }); // Bottom
    points.push({ phi: Math.PI / 2, theta: 0 });
    points.push({ phi: Math.PI / 2, theta: Math.PI / 2 });
    points.push({ phi: Math.PI / 2, theta: Math.PI });
    points.push({ phi: Math.PI / 2, theta: (3 * Math.PI) / 2 });
  } else {
    // Fibonacci Sphere for larger counts
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      points.push({ phi, theta });
    }
  }

  return points;
};

/**
 * Converts Spherical coords to Cartesian Vector3
 * Radius = baseRadius + score * scaleFactor
 */
export const getVectorFromSpherical = (
  radius: number,
  phi: number,
  theta: number
): THREE.Vector3 => {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};
