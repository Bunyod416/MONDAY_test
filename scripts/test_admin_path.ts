import fs from 'fs';
import path from 'path';

const targetDir = path.resolve(process.cwd(), '../MONDAY_admin');
console.log('Target dir:', targetDir, 'exists:', fs.existsSync(targetDir));
