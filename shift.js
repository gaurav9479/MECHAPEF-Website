const fs = require('fs');
const file = 'Client/src/components/CinematicHero/CinematicHero.jsx';
let content = fs.readFileSync(file, 'utf8');

const SHIFT = 610;
const NEW_TOTAL = 3010;

content = content.replace(/2400vh/g, `${NEW_TOTAL}vh`);

content = content.replace(
  'const scene1TextX = useTransform(scrollYProgress, [0/2400, 90/2400], [0, -1000]);',
  `const scene1TextX = useTransform(scrollYProgress, [0/${NEW_TOTAL}, 300/${NEW_TOTAL}, 500/${NEW_TOTAL}, 700/${NEW_TOTAL}], [-1000, 0, 0, -1000]);`
);
content = content.replace(
  'const scene1ImgX = useTransform(scrollYProgress, [0/2400, 90/2400], [0, 1000]);',
  `const scene1ImgX = useTransform(scrollYProgress, [0/${NEW_TOTAL}, 300/${NEW_TOTAL}, 500/${NEW_TOTAL}, 700/${NEW_TOTAL}], [1000, 0, 0, 1000]);`
);
content = content.replace(
  'const scene1Opacity = useTransform(scrollYProgress, [0/2400, 90/2400], [1, 0]);',
  `const scene1Opacity = useTransform(scrollYProgress, [0/${NEW_TOTAL}, 300/${NEW_TOTAL}, 500/${NEW_TOTAL}, 700/${NEW_TOTAL}], [0, 1, 1, 0]);`
);
content = content.replace(
  'const bg1Opacity = useTransform(scrollYProgress, [0/2400, 90/2400], [1, 0]);',
  `const bg1Opacity = useTransform(scrollYProgress, [0/${NEW_TOTAL}, 300/${NEW_TOTAL}, 500/${NEW_TOTAL}, 700/${NEW_TOTAL}], [0, 1, 1, 0]);`
);
content = content.replace(
  'const bg1Display = useTransform(scrollYProgress, (val) => val >= 90/2400 ? "none" : "block");',
  `const bg1Display = useTransform(scrollYProgress, (val) => val >= 700/${NEW_TOTAL} ? "none" : "block");`
);
content = content.replace(
  'const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 90/2400 ? "none" : "auto");',
  `const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 700/${NEW_TOTAL} ? "none" : "auto");`
);

content = content.replace(/(\d+)\/2400/g, (match, p1) => {
  let val = parseInt(p1);
  if (val === 0) return `0/${NEW_TOTAL}`;
  return `${val + SHIFT}/${NEW_TOTAL}`;
});

fs.writeFileSync(file, content);
console.log('Shift complete.');
