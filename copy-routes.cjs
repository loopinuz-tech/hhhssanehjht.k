const fs = require('fs');
const backend = fs.readFileSync('backend/server.js', 'utf8');
const server = fs.readFileSync('server.cjs', 'utf8');

const routesStartStr = '/**\n * AUTH: Get Current Session\n */';
const routesEndStr = '// --- HEALTH CHECK ---';
const routesStartIndex = backend.indexOf(routesStartStr);
const routesEndIndex = backend.indexOf(routesEndStr);

if (routesStartIndex === -1 || routesEndIndex === -1) {
  console.log('Could not find boundaries in backend/server.js');
  process.exit(1);
}

const routesCode = backend.substring(routesStartIndex, routesEndIndex);

const injectPointStr = 'app.post(\'/api/math-solver/solve\', authRequired, upload.single(\'image\'), async (req, res) => {';
const injectPointFallbackStr = '// --- API ROUTES ---';

let injectPointIndex = -1;
let injectionPointLength = 0;

if (server.includes('app.post(\'/api/math-solver/solve\'')) {
    // If it has math-solver, put it after the math solver block
    const endOfMathSolver = server.indexOf('});', server.indexOf('app.post(\'/api/math-solver/solve\'')) + 3;
    injectPointIndex = endOfMathSolver;
    injectionPointLength = 0;
} else {
    injectPointIndex = server.indexOf(injectPointStr);
    injectionPointLength = injectPointStr.length;
}

if (injectPointIndex === -1) {
    injectPointIndex = server.indexOf(injectPointFallbackStr);
    injectionPointLength = injectPointFallbackStr.length;
}

if (injectPointIndex === -1) {
  console.log('Could not find inject point in server.cjs');
  process.exit(1);
}

const finalServer = server.substring(0, injectPointIndex + injectionPointLength) + '\n\n' + routesCode + '\n\n' + server.substring(injectPointIndex + injectionPointLength);

fs.writeFileSync('server.cjs', finalServer);
console.log('Successfully injected routes into server.cjs');
