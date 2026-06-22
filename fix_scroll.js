const fs = require('fs');
const file = 'Client/src/components/CinematicHero/CinematicHero.jsx';
let content = fs.readFileSync(file, 'utf8');

// Reverse the global shift of 610 and change 3010 to 2500.
content = content.replace(/(\d+)\/3010/g, (match, p1) => {
  let val = parseInt(p1);
  if (val === 0 || val === 300 || val === 500 || val === 700) {
    // These are the scene 1 values we messed up.
    // They will be handled manually below.
    return match;
  }
  let original = val - 610; // This restores to the 2400 base
  return `${original}/2500`;
});

// Fix height
content = content.replace(/3010vh/g, '2500vh');

// Restore Scene 1 manually:
content = content.replace(
  'const scene1TextX = useTransform(scrollYProgress, [0/3010, 300/3010, 500/3010, 700/3010], [-1000, 0, 0, -1000]);',
  'const scene1TextX = useTransform(scrollYProgress, [0/2500, 90/2500], [0, -1000]);'
);
content = content.replace(
  'const scene1ImgX = useTransform(scrollYProgress, [0/3010, 300/3010, 500/3010, 700/3010], [1000, 0, 0, 1000]);',
  'const scene1ImgX = useTransform(scrollYProgress, [0/2500, 90/2500], [0, 1000]);'
);
content = content.replace(
  'const scene1Opacity = useTransform(scrollYProgress, [0/3010, 300/3010, 500/3010, 700/3010], [0, 1, 1, 0]);',
  'const scene1Opacity = useTransform(scrollYProgress, [0/2500, 90/2500], [1, 0]);'
);
content = content.replace(
  'const bg1Opacity = useTransform(scrollYProgress, [0/3010, 300/3010, 500/3010, 700/3010], [0, 1, 1, 0]);',
  'const bg1Opacity = useTransform(scrollYProgress, [0/2500, 90/2500], [1, 0]);'
);
content = content.replace(
  'const bg1Display = useTransform(scrollYProgress, (val) => val >= 700/3010 ? "none" : "block");',
  'const bg1Display = useTransform(scrollYProgress, (val) => val >= 90/2500 ? "none" : "block");'
);
content = content.replace(
  'const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 700/3010 ? "none" : "auto");',
  'const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 90/2500 ? "none" : "auto");'
);


// Now inject the new Scene 5 logic:
// We need to replace the entire block of Scene 5 mappings.
// Using a regex to grab it and replace.
const scene5Regex = /\/\/ --- SCENE 5: Join Us[\s\S]*?(?=\/\/ ================= SCENE 1 BACKGROUND =================)/;

const newScene5 = `// --- SCENE 5: Join Us (1800vh to 2500vh) ---
  const scene5PointerEvents = useTransform(scrollYProgress, (val) => (val >= 1800/2500 && val <= 2450/2500) ? "auto" : "none");
  const scene5Opacity = useTransform(scrollYProgress, [1800/2500, 1850/2500, 2450/2500, 2500/2500], [0, 1, 1, 0]);
  
  // Background strips & bot appear TOGETHER over 300vh, hold 200vh, disperse 200vh
  const bg5X = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [-100, 0, 0, 100]);
  const bg5Opacity = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [0, 1, 1, 0]);

  const botY = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [1000, 0, 0, -500]);
  const botOpacity = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [0, 1, 1, 0]);

  const content5Y = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [200, 0, 0, -100]);
  const content5Opacity = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "2500vh" }}>
      <div className="cinematic-camera">
        
        `;

content = content.replace(scene5Regex, newScene5);

fs.writeFileSync(file, content);
console.log('Fixed Scene 1 and injected new Scene 5');
