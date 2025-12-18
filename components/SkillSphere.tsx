import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, QuadraticBezierLine, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Capability, VisualSettings, EnvironmentType } from '../types';
import { getVectorFromSpherical } from '../utils/math';

interface SkillSphereProps {
  capabilities: Capability[];
  settings: VisualSettings;
}

// Distance factor for HTML component scaling
const HTML_DISTANCE_FACTOR = 15;
const LABEL_TIP_OFFSET = 0.4;

interface SkillBarProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  thickness?: number;
  shape?: 'cylinder' | 'cone' | 'prism';
}

const SkillBar: React.FC<SkillBarProps> = ({
  start,
  end,
  color,
  thickness = 0.05,
  shape = 'cylinder'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quaternion = useMemo(() => {
    const defaultUp = new THREE.Vector3(0, 1, 0);
    if (length < 0.0001) return new THREE.Quaternion();
    const dirNormalized = direction.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(defaultUp, dirNormalized);
  }, [start, end, length]);

  const Geometry = useMemo(() => {
    switch (shape) {
      case 'cone': return <cylinderGeometry args={[0.001, thickness, length, 12]} />;
      case 'prism': return <boxGeometry args={[thickness, length, thickness]} />;
      case 'cylinder':
      default: return <cylinderGeometry args={[thickness, thickness, length, 12]} />;
    }
  }, [shape, thickness, length]);

  return (
    <mesh position={position} quaternion={quaternion} ref={meshRef}>
      {Geometry}
      <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
};

const SkillTip = ({ color, shape, size }: { color: string; shape: VisualSettings['tipShape']; size: number; }) => {
    const Geom = useMemo(() => {
        if (shape === 'none') return null;
        switch(shape) {
            case 'cube': return <boxGeometry args={[size, size, size]} />;
            case 'sphere': return <sphereGeometry args={[size/2, 16, 16]} />;
            case 'dodecahedron': return <dodecahedronGeometry args={[size/2, 0]} />;
            case 'octahedron': 
            default: return <octahedronGeometry args={[size/2, 0]} />;
        }
    }, [shape, size]);

    if (!Geom) return null;

    return (
        <mesh>
             {Geom}
             <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    );
};

interface SkillNodeProps {
  capability: Capability;
  settings: VisualSettings;
  tipPosition: THREE.Vector3;
  surfacePosition: THREE.Vector3;
}

const SkillNode: React.FC<SkillNodeProps> = ({ capability, settings, tipPosition, surfacePosition }) => {
  const nodeRef = useRef<THREE.Group>(null);
  const [currentFontSize, setCurrentFontSize] = useState(settings.labelSize);
  
  const labelPos = useMemo(() => {
    const dir = new THREE.Vector3().copy(tipPosition).normalize();
    return new THREE.Vector3().copy(tipPosition).add(dir.multiplyScalar(LABEL_TIP_OFFSET));
  }, [tipPosition]);

  useFrame((state) => {
    if (nodeRef.current) {
      nodeRef.current.lookAt(state.camera.position);
    }
    
    // Auto-scaling logic for labels:
    const distance = state.camera.position.distanceTo(tipPosition);
    const scaleFactor = HTML_DISTANCE_FACTOR / distance;
    const visualSizeOnScreen = settings.labelSize * scaleFactor;
    
    if (visualSizeOnScreen < settings.minLabelSize) {
        // Boost font size to compensate for distance factor so it stays readable on screen
        // Capped at 1500 to avoid excessive memory or browser rendering limits
        setCurrentFontSize(Math.min(1500, settings.minLabelSize / scaleFactor));
    } else {
        setCurrentFontSize(settings.labelSize);
    }
  });

  const showName = settings.labelContent === 'both' || settings.labelContent === 'name';
  const showScore = settings.labelContent === 'both' || settings.labelContent === 'score';

  return (
    <group>
      <SkillBar 
        start={surfacePosition} 
        end={tipPosition} 
        color={capability.color} 
        shape={settings.barShape}
        thickness={settings.barThickness}
      />
      <group position={tipPosition}>
         <SkillTip color={capability.color} shape={settings.tipShape} size={settings.tipSize} />
      </group>
      {settings.showLabels && (
        <Html position={labelPos} center distanceFactor={HTML_DISTANCE_FACTOR} zIndexRange={[100, 0]}>
            <div 
              className="flex flex-row items-center justify-center pointer-events-none select-none transition-all duration-300"
              style={{ opacity: 0.95, width: 'max-content' }}
            >
              <div 
                  className={`px-3 py-1 rounded-md backdrop-blur-lg border border-white/30 shadow-[0_0_25px_rgba(0,0,0,0.8)] flex flex-row items-center ${showName && showScore ? 'gap-2' : 'gap-0'} whitespace-nowrap overflow-visible`}
                  style={{ 
                    backgroundColor: `${capability.color}44`,
                    borderColor: `${capability.color}88`,
                    minWidth: showScore && !showName ? '36px' : 'max-content',
                    justifyContent: 'center',
                    fontSize: `${currentFontSize}px`
                  }}
              >
                  {showScore && (
                      <span 
                          className="font-bold font-mono inline-block text-center" 
                          style={{ 
                              color: capability.color, 
                              textShadow: `0 0 12px ${capability.color}, 0 0 5px #000`
                          }}
                      >
                      {capability.score}
                      </span>
                  )}
                  {showName && (
                      <span 
                          className="font-semibold text-white uppercase tracking-wider inline-block text-center"
                          style={{ 
                            fontSize: '0.85em',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                          }}
                      >
                      {capability.name}
                      </span>
                  )}
              </div>
            </div>
        </Html>
      )}
    </group>
  );
};

const Core = ({ settings }: { settings: VisualSettings }) => {
    const innerRef = useRef<THREE.Mesh>(null);
    const frameRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
      if (settings.autoRotateCore) {
        if (innerRef.current) {
          innerRef.current.rotation.y += 0.003;
          innerRef.current.rotation.x += 0.001;
        }
        if (frameRef.current) {
          frameRef.current.rotation.y -= 0.002;
          frameRef.current.rotation.z += 0.001;
        }
      }
    });

    const Geometry = useMemo(() => {
        switch(settings.coreShape) {
            case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
            case 'dodecahedron': return <dodecahedronGeometry args={[1, 0]} />;
            case 'icosahedron': 
            default: return <icosahedronGeometry args={[1, 2]} />;
        }
    }, [settings.coreShape]);

    return (
        <group>
            {settings.showCoreInner && (
                <mesh ref={innerRef} scale={[settings.coreRadius, settings.coreRadius, settings.coreRadius]}>
                    {Geometry}
                    <meshBasicMaterial color={settings.coreColor} toneMapped={false} />
                </mesh>
            )}
            {settings.showCoreOuter && (
                <mesh ref={frameRef} scale={[settings.coreRadius * 1.2, settings.coreRadius * 1.2, settings.coreRadius * 1.2]}>
                    {Geometry}
                    <meshBasicMaterial 
                        color={settings.coreColor}
                        wireframe={settings.outerCoreStyle === 'wireframe'}
                        transparent
                        opacity={settings.outerCoreStyle === 'wireframe' ? 0.3 : 0.1}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    );
};

interface NodeData {
  id: string;
  pos: THREE.Vector3;
  color: string;
  surfacePos: THREE.Vector3;
  capability: Capability;
}

interface EdgeData {
    start: THREE.Vector3;
    end: THREE.Vector3;
    mid: THREE.Vector3;
    color: string;
    nodeAId: string;
    nodeBId: string;
}

interface FaceData {
    nodeIds: [string, string, string];
    positions: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
    controlPoints: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
    colors: [string, string, string];
}

const getEdgeControlPoint = (p1: THREE.Vector3, p2: THREE.Vector3, style: VisualSettings['connectionStyle']): THREE.Vector3 => {
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    if (style === 'curve-in') mid.multiplyScalar(0.7); 
    else if (style === 'curve-out') mid.multiplyScalar(1.3);
    return mid;
};

const computeConvexHull = (nodes: NodeData[], connectionStyle: VisualSettings['connectionStyle']) => {
  const n = nodes.length;
  if (n < 4) return { edges: [], faces: [] };
  const faces: FaceData[] = [];
  const edgeSet = new Set<string>();
  const edges: EdgeData[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const p1 = nodes[i].pos;
        const p2 = nodes[j].pos;
        const p3 = nodes[k].pos;
        const v1 = new THREE.Vector3().subVectors(p2, p1);
        const v2 = new THREE.Vector3().subVectors(p3, p1);
        const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
        let side = 0; let isFace = true;
        for (let m = 0; m < n; m++) {
          if (m === i || m === j || m === k) continue;
          const vm = new THREE.Vector3().subVectors(nodes[m].pos, p1);
          const dot = normal.dot(vm);
          if (Math.abs(dot) > 1e-4) {
             const currentSide = Math.sign(dot);
             if (side === 0) side = currentSide;
             else if (side !== currentSide) { isFace = false; break; }
          }
        }
        if (isFace) {
          faces.push({
            nodeIds: [nodes[i].id, nodes[j].id, nodes[k].id],
            positions: [p1, p2, p3],
            controlPoints: [
              getEdgeControlPoint(p1, p2, connectionStyle),
              getEdgeControlPoint(p2, p3, connectionStyle),
              getEdgeControlPoint(p3, p1, connectionStyle),
            ],
            colors: [nodes[i].color, nodes[j].color, nodes[k].color]
          });
          [[i, j], [j, k], [k, i]].forEach(pair => {
             const [a, b] = pair.sort((x, y) => x - y);
             const edgeKey = `${nodes[a].id}-${nodes[b].id}`;
             if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                edges.push({
                   start: nodes[a].pos, end: nodes[b].pos,
                   mid: getEdgeControlPoint(nodes[a].pos, nodes[b].pos, connectionStyle),
                   color: nodes[a].color, nodeAId: nodes[a].id, nodeBId: nodes[b].id
                });
             }
          });
        }
      }
    }
  }
  return { edges, faces };
};

const computeNearestNeighborGraph = (nodes: NodeData[], settings: VisualSettings) => {
    const { connectionStyle, connectionNeighbors } = settings;
    const edges: EdgeData[] = [];
    const uniqueEdgeKeys = new Set<string>();
    const symmetricAdj = new Map<string, Set<string>>();
    const effectiveNeighbors = Math.max(1, Math.min(nodes.length - 1, connectionNeighbors));
    nodes.forEach((nodeA, i) => {
        const neighbors = nodes
            .filter((_, j) => i !== j)
            .map(nodeB => ({ id: nodeB.id, dist: nodeA.pos.distanceTo(nodeB.pos) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, effectiveNeighbors);
        neighbors.forEach(n => {
            const nodeB = nodes.find(x => x.id === n.id)!;
            if (!symmetricAdj.has(nodeA.id)) symmetricAdj.set(nodeA.id, new Set());
            symmetricAdj.get(nodeA.id)!.add(nodeB.id);
            if (!symmetricAdj.has(nodeB.id)) symmetricAdj.set(nodeB.id, new Set());
            symmetricAdj.get(nodeB.id)!.add(nodeA.id);
            const [id1, id2] = [nodeA.id, nodeB.id].sort();
            const edgeKey = `${id1}-${id2}`;
            if (!uniqueEdgeKeys.has(edgeKey)) {
                uniqueEdgeKeys.add(edgeKey);
                edges.push({
                    start: nodeA.pos, end: nodeB.pos,
                    mid: getEdgeControlPoint(nodeA.pos, nodeB.pos, connectionStyle),
                    color: nodeA.color, nodeAId: id1, nodeBId: id2
                });
            }
        });
    });
    const faces: FaceData[] = [];
    const processedFaces = new Set<string>();
    edges.forEach(edge => {
        const idA = edge.nodeAId; const idB = edge.nodeBId;
        const neighborsA = symmetricAdj.get(idA); const neighborsB = symmetricAdj.get(idB);
        if (neighborsA && neighborsB) {
             nodes.forEach(nodeC => {
                 if (nodeC.id !== idA && nodeC.id !== idB) {
                     if (neighborsA.has(nodeC.id) && neighborsB.has(nodeC.id)) {
                         const ids = [idA, idB, nodeC.id].sort();
                         const faceKey = ids.join('-');
                         if (!processedFaces.has(faceKey)) {
                             processedFaces.add(faceKey);
                             const nodeA = nodes.find(n => n.id === ids[0])!;
                             const nodeB = nodes.find(n => n.id === ids[1])!;
                             const nodeC_ = nodes.find(n => n.id === ids[2])!;
                             faces.push({
                                nodeIds: [ids[0], ids[1], ids[2]],
                                positions: [nodeA.pos, nodeB.pos, nodeC_.pos],
                                controlPoints: [
                                    getEdgeControlPoint(nodeA.pos, nodeB.pos, connectionStyle),
                                    getEdgeControlPoint(nodeB.pos, nodeC_.pos, connectionStyle),
                                    getEdgeControlPoint(nodeC_.pos, nodeA.pos, connectionStyle)
                                ],
                                colors: [nodeA.color, nodeB.color, nodeC_.color]
                             });
                         }
                     }
                 }
             });
        }
    });
    return { edges, faces };
};

const useGraphData = (nodes: NodeData[], settings: VisualSettings) => {
  return useMemo(() => {
    const { connectionStyle, connectionMode } = settings;
    if (connectionStyle === 'none') return { edges: [], faces: [] };
    if (connectionMode === 'auto') return computeConvexHull(nodes, connectionStyle);
    else return computeNearestNeighborGraph(nodes, settings);
  }, [nodes, settings.connectionStyle, settings.connectionNeighbors, settings.connectionMode]);
};

const ConnectivityWeb = ({ edges, settings }: { edges: EdgeData[], settings: VisualSettings }) => {
  const { connectionStyle, connectionThickness, useCustomConnectionColor, connectionColor } = settings;
  if (connectionStyle === 'none') return null;
  return (
    <group>
      {edges.map((line, idx) => {
        const finalColor = useCustomConnectionColor ? connectionColor : line.color;
        if (connectionStyle === 'straight') {
             return <SkillBar key={idx} start={line.start} end={line.end} color={finalColor} thickness={connectionThickness * 0.01} shape="cylinder" />
        } else {
             return <QuadraticBezierLine key={idx} start={line.start} end={line.end} mid={line.mid} color={finalColor} lineWidth={connectionThickness} transparent opacity={0.6} />
        }
      })}
    </group>
  );
};

const SkillMesh = ({ faces, settings, uniqueKey }: { faces: FaceData[], settings: VisualSettings, uniqueKey: string }) => {
  const { fillMesh, fillColorMode, fillSolidColor, fillOpacity, connectionStyle, coreColor } = settings;
  const meshData = useMemo(() => {
    if (!fillMesh || faces.length === 0 || connectionStyle === 'none') return null;
    const positions: number[] = []; const colors: number[] = [];
    const sColor = new THREE.Color(fillColorMode === 'core' ? coreColor : fillSolidColor);
    const isStraight = connectionStyle === 'straight';
    const segments = isStraight ? 1 : 12; 
    faces.forEach(face => {
        const [P1, P2, P3] = face.positions; const [E1, E2, E3] = face.controlPoints;
        const [C1, C2, C3] = face.colors.map(c => new THREE.Color(c));
        if (isStraight) {
            positions.push(P1.x, P1.y, P1.z, P2.x, P2.y, P2.z, P3.x, P3.y, P3.z);
            if (fillColorMode === 'gradient') colors.push(C1.r, C1.g, C1.b, C2.r, C2.g, C2.b, C3.r, C3.g, C3.b);
            else colors.push(sColor.r, sColor.g, sColor.b, sColor.r, sColor.g, sColor.b, sColor.r, sColor.g, sColor.b);
        } else {
            const getPoint = (u: number, v: number, w: number) => {
                const p = new THREE.Vector3();
                p.addScaledVector(P1, u * u); p.addScaledVector(P2, v * v); p.addScaledVector(P3, w * w);
                p.addScaledVector(E1, 2 * u * v); p.addScaledVector(E2, 2 * v * w); p.addScaledVector(E3, 2 * w * u);
                return p;
            };
            const getColor = (u: number, v: number, w: number) => {
                const c = new THREE.Color(0,0,0);
                if (fillColorMode === 'gradient') { c.r = C1.r * u + C2.r * v + C3.r * w; c.g = C1.g * u + C2.g * v + C3.g * w; c.b = C1.b * u + C2.b * v + C3.b * w; }
                else c.copy(sColor);
                return c;
            };
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments - i; j++) {
                    const k = segments - i - j;
                    const u1 = i / segments; const v1 = j / segments; const w1 = k / segments;
                    const p1 = getPoint(u1, v1, w1); const c1 = getColor(u1, v1, w1);
                    const u2 = (i + 1) / segments; const v2 = j / segments; const w2 = (k - 1) / segments;
                    const p2 = getPoint(u2, v2, w2); const c2 = getColor(u2, v2, w2);
                    const u3 = i / segments; const v3 = (j + 1) / segments; const w3 = (k - 1) / segments;
                    const p3 = getPoint(u3, v3, w3); const c3 = getColor(u3, v3, w3);
                    positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                    colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b, c3.r, c3.g, c3.b);
                    if (i + j + 1 < segments) {
                        const u4 = (i + 1) / segments; const v4 = (j + 1) / segments; const w4 = (k - 2) / segments;
                        const p4 = getPoint(u4, v4, w4); const c4 = getColor(u4, v4, w4);
                        positions.push(p2.x, p2.y, p2.z, p4.x, p4.y, p4.z, p3.x, p3.y, p3.z);
                        colors.push(c2.r, c2.g, c2.b, c4.r, c4.g, c4.b, c3.r, c3.g, c3.b);
                    }
                }
            }
        }
    });
    return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
  }, [faces, fillMesh, fillColorMode, fillSolidColor, connectionStyle, coreColor]);
  
  if (!meshData) return null;
  
  const isOpaque = fillOpacity >= 0.99;
  
  return (
    <mesh renderOrder={isOpaque ? 0 : 5}>
      <bufferGeometry key={uniqueKey}>
        <bufferAttribute attach="attributes-position" count={meshData.positions.length / 3} array={meshData.positions} itemSize={3} needsUpdate={true} />
        <bufferAttribute attach="attributes-color" count={meshData.colors.length / 3} array={meshData.colors} itemSize={3} needsUpdate={true} />
      </bufferGeometry>
      <meshBasicMaterial 
        vertexColors 
        side={THREE.DoubleSide} 
        transparent={!isOpaque} 
        opacity={fillOpacity} 
        depthWrite={isOpaque} 
        depthTest={true} 
        blending={THREE.NormalBlending} 
      />
    </mesh>
  );
};

// SCALED UP ENVIRONMENT COMPONENTS to prevent camera blackouts when zooming out
const StarFieldEnv = () => ( <> <Stars radius={4000} depth={500} count={6000} factor={4} saturation={0} fade speed={0.5} /> <Sparkles count={200} scale={150} size={2} speed={0.2} opacity={0.4} /> </> );
const NebulaEnv = () => ( <> <Stars radius={4000} depth={500} count={3000} factor={4} saturation={1} fade speed={0.2} /> <Cloud opacity={0.3} speed={0.1} bounds={[300, 100, 150]} segments={20} color="#a855f7" position={[0, -50, -100]} /> <Cloud opacity={0.2} speed={0.1} bounds={[300, 100, 150]} segments={20} color="#3b82f6" position={[0, 50, -100]} /> <Sparkles count={400} scale={200} size={3} speed={0.1} opacity={0.6} color="#ffffff" /> </> );
const DigitalGridEnv = ({ matrix = false }) => ( <group> <gridHelper args={[2500, 100, matrix ? '#00ff00' : '#888888', matrix ? '#003300' : '#222222']} position={[0, -200, 0]} /> <gridHelper args={[2500, 100, matrix ? '#00ff00' : '#888888', matrix ? '#003300' : '#222222']} position={[0, 200, 0]} /> <Sparkles count={300} scale={300} size={matrix ? 2 : 4} speed={0.5} opacity={0.8} color={matrix ? '#00ff00' : '#00ffff'} noise={1} /> </group> );
const OceanEnv = () => ( <group> <ambientLight intensity={0.5} color="#0044aa" /> <Sparkles count={800} scale={250} size={5} speed={1.5} opacity={0.5} color="#88ccff" /> </group> );

const EnvironmentLayer = ({ type }: { type: EnvironmentType }) => { switch(type) { case 'nebula': return <NebulaEnv />; case 'grid': return <DigitalGridEnv matrix={false} />; case 'matrix': return <DigitalGridEnv matrix={true} />; case 'ocean': return <OceanEnv />; case 'none': return null; case 'stars': default: return <StarFieldEnv />; } };

const SceneContent = ({ capabilities, settings }: SkillSphereProps) => {
    const nodes = useMemo(() => {
        return capabilities.map(cap => {
            const tipPos = new THREE.Vector3(); const surfacePos = new THREE.Vector3();
            const tipDist = settings.coreRadius + settings.barBaseLength + (cap.score * settings.scoreScale);
            const tipVec = getVectorFromSpherical(tipDist, cap.phi, cap.theta);
            tipPos.copy(tipVec);
            const surfVec = getVectorFromSpherical(settings.coreRadius, cap.phi, cap.theta);
            surfacePos.copy(surfVec);
            return { id: cap.id, color: cap.color, pos: tipPos, surfacePos: surfacePos, capability: cap };
        });
    }, [capabilities, settings.coreRadius, settings.scoreScale, settings.barBaseLength]);
    
    const { edges, faces } = useGraphData(nodes, settings);
    
    const geometryKey = useMemo(() => {
        const scoreKey = capabilities.map(c => c.score).join('-');
        const colorKey = settings.fillColorMode === 'core' ? settings.coreColor : (settings.fillColorMode === 'solid' ? settings.fillSolidColor : 'grad');
        return `R${settings.coreRadius}-S${settings.scoreScale}-B${settings.barBaseLength}-${scoreKey}-${settings.connectionMode}-${settings.connectionNeighbors}-${settings.connectionStyle}-${settings.fillColorMode}-${colorKey}-${settings.fillOpacity}`;
    }, [capabilities, settings]);

    return (
        <>
            <EnvironmentLayer type={settings.environmentType} />
            <group>
                <Core settings={settings} />
                <ConnectivityWeb edges={edges} settings={settings} />
                <SkillMesh faces={faces} settings={settings} uniqueKey={geometryKey} />
                {nodes.map((node) => (
                    <SkillNode key={node.id} capability={node.capability} settings={settings} tipPosition={node.pos} surfacePosition={node.surfacePos} />
                ))}
            </group>
        </>
    );
};

const SkillSphere: React.FC<SkillSphereProps> = ({ capabilities, settings }) => {
  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl border border-white/5">
      <Canvas camera={{ position: [0, 5, 20], fov: 50, far: 20000 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }}>
        {!settings.backgroundImage && <color attach="background" args={[settings.backgroundColor]} />}
        
        {/* Adjusted Fog range significantly to prevent "all black" washout at medium/high zoom */}
        {settings.environmentType !== 'ocean' && settings.environmentType !== 'matrix' && !settings.backgroundImage && 
          <fog attach="fog" args={[settings.backgroundColor, 3000, 18000]} />
        }
        
        {/* Specific internal fog for matrix mode if needed, but scaled up to avoid blackout at 40 distance */}
        {settings.environmentType === 'matrix' && (
           <fog attach="fog" args={['#000000', 100, 1500]} />
        )}
        
        <ambientLight intensity={0.2} />
        <pointLight position={[100, 100, 100]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-100, -50, -100]} intensity={2.5} color={settings.coreColor} />
        
        <SceneContent capabilities={capabilities} settings={settings} />
        
        <OrbitControls 
            enablePan={false} 
            minDistance={2} 
            maxDistance={5000} 
            autoRotate={settings.autoRotateScene} 
            autoRotateSpeed={0.5} 
        />
      </Canvas>
    </div>
  );
};

export default SkillSphere;