const fs = require('fs');
const file = 'Client/src/components/CinematicHero/CinematicHero.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace 2200 with 2400
content = content.replace(/2200/g, '2400');

// Update Scene 5 durations: botY from 1980 to 2180, content5Y from 1980 to 2180
content = content.replace('1980/2400', '2180/2400'); // for botY
content = content.replace('1980/2400', '2180/2400'); // for content5Y (it will replace both if I use global, but let's do regex)
content = content.replace(/1980\/2400/g, '2180/2400');

// add light class to scene container
content = content.replace('className="scene-container"', 'className="scene-container scene-5-light"');

fs.writeFileSync(file, content);
console.log('Done replacing!');
