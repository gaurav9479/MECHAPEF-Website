const fs = require('fs');
const { execSync } = require('child_process');

const files = fs.readFileSync('files_to_commit.txt', 'utf8')
  .split('\n')
  .map(f => f.trim())
  .filter(f => f.length > 0);

const totalCommits = 27;
const filesPerCommit = Math.max(1, Math.floor(files.length / totalCommits));

let commitNum = 1;
let fileIdx = 0;

while (commitNum < totalCommits && fileIdx < files.length) {
  let addedAny = false;
  for (let i = 0; i < filesPerCommit; i++) {
    if (fileIdx < files.length) {
      execSync(`git add "${files[fileIdx]}"`);
      fileIdx++;
      addedAny = true;
    }
  }
  
  if (addedAny) {
    execSync(`git commit -m "Admin panel and UI enhancements - Part ${commitNum}"`);
    commitNum++;
  }
}

let addedAny = false;
while (fileIdx < files.length) {
  execSync(`git add "${files[fileIdx]}"`);
  fileIdx++;
  addedAny = true;
}

if (addedAny) {
  execSync(`git commit -m "Final bug fixes, layout stability and cropper implementation"`);
}

execSync('git push');
