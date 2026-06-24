import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const EngineMechanism = () => {
  const pistonRef = useRef();
  const conrodGroupRef = useRef();
  const crankGroupRef = useRef();
  const lightRef = useRef();
  const sparkRef = useRef();

  const r = 1.2; // Crank radius
  const l = 3.5; // Conrod length
  const speed = 6; // Engine speed

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const theta = t;

    // Piston position y_p
    const yp = r * Math.cos(theta) + Math.sqrt(l * l - Math.pow(r * Math.sin(theta), 2));
    // Conrod angle phi
    const phi = Math.asin((r * Math.sin(theta)) / l);

    if (pistonRef.current) pistonRef.current.position.y = yp;
    if (conrodGroupRef.current) {
      conrodGroupRef.current.position.y = yp;
      conrodGroupRef.current.rotation.z = phi;
    }
    if (crankGroupRef.current) crankGroupRef.current.rotation.z = -theta;

    // 4-Stroke Combustion Logic
    // One full cycle = 4 * PI radians
    const cycle = t % (4 * Math.PI);
    if (lightRef.current && sparkRef.current) {
      if (cycle >= 0 && cycle < 0.6) {
        // Combustion flash
        const intensity = (1 - cycle / 0.6) * 150;
        lightRef.current.intensity = intensity;
        sparkRef.current.opacity = 1 - (cycle / 0.6);
      } else {
        lightRef.current.intensity = 0;
        sparkRef.current.opacity = 0;
      }
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Combustion Light */}
      <pointLight ref={lightRef} position={[0, r + l + 1.5, 0]} color="#ff4400" distance={10} />
      
      {/* Spark glow */}
      <mesh ref={sparkRef} position={[0, r + l + 1.2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Engine Block (Transparent Cylinder) */}
      <mesh position={[0, r + l - 1, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 4, 32]} />
        <meshPhysicalMaterial 
          color="#88ccff" 
          transmission={0.8} 
          opacity={1} 
          metalness={0.1} 
          roughness={0.1} 
          transparent 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Wireframe wrapper for block */}
      <mesh position={[0, r + l - 1, 0]}>
        <cylinderGeometry args={[1.51, 1.51, 4, 16]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Crankshaft Center */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 3, 32]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Rotating Crank Group */}
      <group ref={crankGroupRef}>
        {/* Crank Webs */}
        <mesh position={[0, r/2, 0.8]}>
          <boxGeometry args={[1, r + 0.5, 0.4]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, r/2, -0.8]}>
          <boxGeometry args={[1, r + 0.5, 0.4]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Crank Pin (Connects webs, where conrod attaches) */}
        <mesh position={[0, r, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1.6, 32]} />
          <meshStandardMaterial color="#888" metalness={1} roughness={0.2} />
        </mesh>
      </group>

      {/* Conrod Group (Origin at Piston Pin, points down to Crank Pin) */}
      <group ref={conrodGroupRef}>
        {/* Piston Pin */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 1.2, 32]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* The Rod itself */}
        <mesh position={[0, -l / 2, 0]}>
          <boxGeometry args={[0.4, l, 0.4]} />
          <meshStandardMaterial color="#666" metalness={0.6} roughness={0.5} />
        </mesh>
        
        {/* Bottom Ring of Conrod (around crank pin) */}
        <mesh position={[0, -l, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.5, 32]} />
          <meshStandardMaterial color="#666" metalness={0.6} roughness={0.5} />
        </mesh>
      </group>

      {/* Piston */}
      <mesh ref={pistonRef}>
        {/* Piston Head */}
        <cylinderGeometry args={[1.4, 1.4, 1.2, 32]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.3} />
        
        {/* Piston Grooves (Cosmetic) */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1.42, 1.42, 0.05, 32]} />
          <meshStandardMaterial color="#222" metalness={1} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.42, 1.42, 0.05, 32]} />
          <meshStandardMaterial color="#222" metalness={1} roughness={0.8} />
        </mesh>
      </mesh>
    </group>
  );
};

const ICEngine3D = () => {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#050505' }}>
      <Canvas camera={{ position: [5, 4, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4466ff" />

        <Suspense fallback={null}>
          <EngineMechanism />
          {/* Cinematic effects */}
          <Environment preset="city" />
          <ContactShadows position={[0, -3.5, 0]} opacity={0.5} scale={15} blur={2} far={10} color="#ff1f01" />
        </Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={1.5}
          maxPolarAngle={Math.PI / 2 + 0.2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      {/* Gradient overlay to blend with slider UI */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        pointerEvents: 'none'
      }}></div>
    </div>
  );
};

export default ICEngine3D;
