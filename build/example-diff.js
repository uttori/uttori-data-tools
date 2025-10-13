import { DataBuffer, formatDiffHex, formatDiffHunks, hunks, formatMyersGraph, Myers } from '../src/index.js';

// Example 1: Basic diff between two buffers
console.log('=== Example 1: DataBuffer.diff() ===');
const buffer1 = new DataBuffer([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
const buffer2 = new DataBuffer([0x48, 0x65, 0x79, 0x79, 0x6F]); // "Heyyo"

const edits = buffer1.diff(buffer2);
console.log('Number of edits:', edits.length);
console.log('Edits:', edits);

// Example 2: Format diff as hex table
console.log('\n=== Example 2: formatDiffHex() ===');
const hexDiff = formatDiffHex(edits, { bytesPerRow: 8, showBits: true, showAscii: true });
console.log(hexDiff);

// Example 3: Format diff as hunks
console.log('\n=== Example 3: formatDiffHunks() ===');
const original = [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64]; // "Hello World"
const modified = [0x48, 0x65, 0x79, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21];       // "Hey World!"

const diffHunks = hunks(original, modified);
console.log('Number of hunks:', diffHunks.length);
const hunksDiff = formatDiffHunks(diffHunks);
console.log(hunksDiff);

// Example 4: Larger binary diff
console.log('\n=== Example 4: Binary file comparison ===');
const file1 = new DataBuffer(Array.from({ length: 64 }, (_, i) => i));
const file2 = new DataBuffer(Array.from({ length: 64 }, (_, i) => i === 32 ? 0xFF : i));

const binaryEdits = file1.diff(file2);
const binaryDiff = formatDiffHex(binaryEdits, { bytesPerRow: 16 });
console.log(binaryDiff);

// Myers Graph
console.log('=== Example 1: [a,b,c] → [a,x,c] ===');
const x1 = ['a', 'b', 'c'];
const y1 = ['a', 'x', 'c'];
const m1 = new Myers(x1.map((_, i) => i), y1.map((_, i) => i), x1, y1, (a, b) => a === b);
m1.compare(m1.smin, m1.smax, m1.tmin, m1.tmax);
console.log('Path taken:');
console.log(formatMyersGraph(m1.resultVectorX, m1.resultVectorY, x1, y1));
console.log('\nFull grid (diagonals at (0,0) and (2,2)):');
console.log(formatMyersGraph(m1.resultVectorX, m1.resultVectorY, x1, y1, { showFull: true }));

console.log('\n\n=== Example 2: Identical sequences [a,b,c] → [a,b,c] ===');
const x2 = ['a', 'b', 'c'];
const y2 = ['a', 'b', 'c'];
const m2 = new Myers(x2.map((_, i) => i), y2.map((_, i) => i), x2, y2, (a, b) => a === b);
m2.compare(m2.smin, m2.smax, m2.tmin, m2.tmax);
console.log('Path (should be all diagonal):');
console.log(formatMyersGraph(m2.resultVectorX, m2.resultVectorY, x2, y2));

console.log('\n\n=== Example 3: Completely different [a,b] → [x,y] ===');
const x3 = ['a', 'b'];
const y3 = ['x', 'y'];
const m3 = new Myers(x3.map((_, i) => i), y3.map((_, i) => i), x3, y3, (a, b) => a === b);
m3.compare(m3.smin, m3.smax, m3.tmin, m3.tmax);
console.log('Path (no diagonals):');
console.log(formatMyersGraph(m3.resultVectorX, m3.resultVectorY, x3, y3));
console.log('\nFull grid (no diagonals at all):');
console.log(formatMyersGraph(m3.resultVectorX, m3.resultVectorY, x3, y3, { showFull: true }));
