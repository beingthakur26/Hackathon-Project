import React from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Sphere, 
  Cylinder, 
  Text,
  PivotControls
} from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from './useLabStore';
import './Molecule3DCanvas.css';

const ATOM_COLORS: Record<string, string> = {
  'H': '#ffffff',
  'C': '#2d2d2d',
  'O': '#ff4d4d',
  'N': '#4d79ff',
  'P': '#ff9933',
  'S': '#ffcc00',
  'Cl': '#19e619',
  'F': '#70ff70',
  'Br': '#8b4513',
  'I': '#9400d3'
};

const AtomMesh: React.FC<{ 
  id: string; 
  element: string; 
  position: [number, number, number];
  isDraggable: boolean;
}> = ({ id, element, position, isDraggable }) => {
  const updateAtomPosition = useLabStore(state => state.updateAtomPosition);
  const mode = useLabStore(state => state.mode);
  const removeAtom = useLabStore(state => state.removeAtom);

  const handleDrag = (matrix: THREE.Matrix4) => {
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(matrix);
    updateAtomPosition(id, pos.x, pos.y, pos.z);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (mode === 'erase') {
      removeAtom(id);
    }
  };

  const color = ATOM_COLORS[element] || '#cccccc';

  return (
    <PivotControls
      activeAxes={[true, true, true]}
      depthTest={false}
      anchor={[0, 0, 0]}
      onDrag={handleDrag}
      enabled={isDraggable && mode === 'atom'}
      scale={0.5}
    >
      <group position={position} onClick={handleClick}>
        <Sphere args={[0.3, 32, 32]}>
          <meshStandardMaterial 
            color={color} 
            roughness={0.3} 
            metalness={0.2} 
            emissive={color}
            emissiveIntensity={0.2}
          />
        </Sphere>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {element}
        </Text>
      </group>
    </PivotControls>
  );
};

const BondMesh: React.FC<{ 
  from: [number, number, number]; 
  to: [number, number, number];
  type: number;
}> = ({ from, to, type }) => {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  return (
    <group position={midpoint} quaternion={quaternion}>
      <Cylinder args={[0.08, 0.08, length, 8]}>
        <meshStandardMaterial color="#888888" roughness={0.5} />
      </Cylinder>
      {type >= 2 && (
        <group position={[0.12, 0, 0]}>
          <Cylinder args={[0.08, 0.08, length, 8]}>
            <meshStandardMaterial color="#888888" roughness={0.5} />
          </Cylinder>
        </group>
      )}
      {type === 3 && (
        <group position={[-0.12, 0, 0]}>
          <Cylinder args={[0.08, 0.08, length, 8]}>
            <meshStandardMaterial color="#888888" roughness={0.5} />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

export const Molecule3DCanvas: React.FC = () => {
  const { atoms, bonds } = useLabStore();

  return (
    <div className="molecule-3d-canvas">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

        <gridHelper args={[20, 20, '#333333', '#222222']} position={[0, -2, 0]} />

        <group>
          {atoms.map(atom => (
            <AtomMesh
              key={atom.id}
              id={atom.id}
              element={atom.element}
              position={[atom.x / 50, atom.y / 50, atom.z / 50]} // Scaled for 3D space
              isDraggable={true}
            />
          ))}

          {bonds.map(bond => {
            const from = atoms.find(a => a.id === bond.from);
            const to = atoms.find(a => a.id === bond.to);
            if (!from || !to) return null;

            return (
              <BondMesh
                key={bond.id}
                from={[from.x / 50, from.y / 50, from.z / 50]}
                to={[to.x / 50, to.y / 50, to.z / 50]}
                type={bond.type}
              />
            );
          })}
        </group>
      </Canvas>
      <div className="canvas-3d-hint">
        3D Synthesis Mode • Use Pivot Handles to Move Atoms • Right Click to Orbit
      </div>
    </div>
  );
};
