// UTTORI_DATA_DEBUG=true DEBUG=* node build/ips.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

import IPS from '../src/patch/data-patch-ips.js';
import CRC32 from '../src/data-hash-crc32.js';
import DataBuffer from '../src/data-buffer.js';

const __dirname = new URL('.', import.meta.url).pathname;

console.log('Read and parsed the IPS file and save a new one with the same contents and CRC32: Chrono Trigger - JP Title Screen (hack).ips');
const data = await fs.readFile(path.join(__dirname, 'Chrono Trigger - JP Title Screen (hack).ips'));
const patch = new IPS(data);
patch.parse();
console.log('Patch Size in bytes:', data.length, ' === 2730');
console.log('Patch CRC32:', CRC32.of(data), ' === 51D639B0');
console.log('========================================');

console.log('Re-Encode the patch');
const output = patch.encode();
console.log('Output Size in bytes:', output.data.length, ' === 2730');
console.log('Output CRC32:', CRC32.of(output), ' === 51D639B0');

// Apply the patch to the original file
console.log('Apply the patch to the original file');
const original = await fs.readFile(path.join(__dirname, 'Chrono Trigger (USA).sfc'));
console.log('Original Size in bytes:', original.length, ' === 4194304');
console.log('Original CRC32:', CRC32.of(original), ' === 2D206BF7');
const patched = patch.apply(new DataBuffer(original));
patched.commit();
console.log('Patched Size in bytes:', patched.length, ' === 4194304');
console.log('Patched CRC32:', CRC32.of(patched.data), ' === DC345DF7');
await fs.writeFile(path.join(__dirname, 'Chrono Trigger (USA).patched.sfc'), Buffer.from(patched.data));

// Recreate a new patch from the patched file
console.log('========================================');
console.log('Recreate a new patch from the patched file');
const newPatch = IPS.createIPSFromDataBuffers(new DataBuffer(original), new DataBuffer(patched.data));
const newOutput = newPatch.encode();
console.log('New Patch Size in bytes:', newOutput.data.length, ' === 2730');
console.log('New Patch CRC32:', CRC32.of(newOutput), ' === 51D639B0');
await fs.writeFile(path.join(__dirname, 'Chrono Trigger (USA).patched.ips'), Buffer.from(newOutput.data));

// Compare the new patch with the original patch
console.log('========================================');
console.log('Compare the new patch with the original patch');
console.log('New Patch Size in bytes:', newOutput.data.length, ' === 2730');
console.log('New Patch CRC32:', CRC32.of(newOutput), ' === 51D639B0');
console.log('Original Patch Size in bytes:', data.length, ' === 2730');
console.log('Original Patch CRC32:', CRC32.of(data), ' === 51D639B0');
console.log('New Patch is equal to Original Patch:', newOutput.compare(data));
