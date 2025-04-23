// import { Canvas } from "@react-three/fiber";
// import { Suspense, useEffect, useState } from "react";
// import { KeyboardControls } from "@react-three/drei";
// import { useAudio } from "./lib/stores/useAudio";
// import "@fontsource/inter";

// // Import our game components

// // Define control keys for the game
// const controls = [
//   { name: "forward", keys: ["KeyW", "ArrowUp"] },
//   { name: "backward", keys: ["KeyS", "ArrowDown"] },
//   { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
//   { name: "rightward", keys: ["KeyD", "ArrowRight"] },
//   { name: "punch", keys: ["KeyJ"] },
//   { name: "kick", keys: ["KeyK"] },
//   { name: "block", keys: ["KeyL"] },
//   { name: "special", keys: ["Space"] },
// ];

// // Main App component
// function App() {
//   const { gamePhase } = useFighting();
//   const [showCanvas, setShowCanvas] = useState(false);

//   // Show the canvas once everything is loaded
//   useEffect(() => {
//     setShowCanvas(true);
//   }, []);

//   return (
//     <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
//       {showCanvas && (
//         <KeyboardControls map={controls}>
//           {gamePhase === 'menu' && <Menu />}

//           {gamePhase === 'character_selection' && <CharacterSelection />}

//           {(gamePhase === 'fighting' || gamePhase === 'round_end' || gamePhase === 'match_end') && (
//             <>
//               <Canvas
//                 shadows
//                 camera={{
//                   position: [0, 2, 8],
//                   fov: 45,
//                   near: 0.1,
//                   far: 1000
//                 }}
//                 gl={{
//                   antialias: true,
//                   powerPreference: "default"
//                 }}
//               >
//                 <color attach="background" args={["#111111"]} />

//                 {/* Lighting */}
//                 <Lights />

//                 <Suspense fallback={null}>
//                 </Suspense>
//               </Canvas>
//               <GameUI />
//             </>
//           )}

//           <ShortcutManager />
//           <SoundManager />
//         </KeyboardControls>
//       )}
//     </div>
//   );
// }

// export default App;
