import { ImageHEIC } from '../../src/index.js';

// Assuming you’ve added the two helpers we discussed:
//   - hevcLengthPrefixedToAnnexB(bytes, hvcc)
//   - decodeHeifWithWebCodecs({ esAnnexB, hvccDescription, width, height, codec })
// And your ImageHEIC class exposes:
//   - ImageHEIC.fromFile(Uint8Array)
//   - buildIndex(), getPrimaryItemID(), getItemData(id),
//   - getItemProperties(id) (with an 'ispe' entry for width/height),
//   - getHevcConfig(id) returning both parsed fields and raw hvcC bytes as hvcc.raw (or similar).

async function replaceHeicImg(img) {
  console.log('replaceHeicImg:', img);
  const url = img.getAttribute('src');
  const res = await fetch(url);
  const buf = await res.arrayBuffer();

  // 1) Parse the HEIF container
  const heic = ImageHEIC.fromFile(new Uint8Array(buf));
  heic.buildIndex();
  console.log('heic:', heic);
  const itemID = heic.getPrimaryItemID();
  console.log('getPrimaryItemID:', itemID);

  // 2) Collect item bytes + config
  const itemBytes = heic.getItemData(itemID);          // length-prefixed HEVC NALUs
  console.log('itemBytes:', itemBytes);
  const hvcc = heic.getHevcConfig(itemID);             // parsed hvcC (must include raw record bytes)
  console.log('hvcc:', hvcc);
  if (!hvcc) throw new Error('Missing hvcC for primary item');

  const properties = heic.getItemProperties(itemID);
  console.log('properties:', properties); // returns object: { ispe: {...}, irot: {...}, ... }
  const ispe = properties?.ispe;
  if (!ispe) throw new Error('Missing ispe');
  const { width, height } = ispe;

  // 3) Convert to Annex-B and decode via WebCodecs
  // ES (Annex-B) + DecoderConfigurationRecord
  const esAnnexB = heic.hevcLengthPrefixedToAnnexB(itemBytes, {
    lengthSizeMinusOne: hvcc.lengthSizeMinusOne,
    arrays: (hvcc.arrays || []).map(a => ({
      nalUnitType: a.arrayType,
      nalus: (a.nalUnits || []).map(u => u.data),
    })),
  });

  // IMPORTANT: pass the *raw* hvcC record as description; name may vary in your parser (e.g. hvcc.raw / hvcc.bytes)
  // Raw hvcC bytes for WebCodecs description
  const hvccDescription =
    hvcc.raw instanceof Uint8Array ? hvcc.raw :
    new Uint8Array(hvcc.rawBytes || hvcc.bytes || []);

  console.log('hvccDescription:', heic.rfc6381CodecFromHvcc(hvcc, 'hvc1'));

  // Decode via WebCodecs (with codec probing)
  const { rgba } = await heic.decodeHeifWithWebCodecs({
    esAnnexB,
    hvccDescription,
    width,
    height,
    hvccParsed: {
      generalProfileIdc: hvcc.generalProfileIdc,
      generalProfileCompatibilityFlags: hvcc.generalProfileCompatibilityFlags >>> 0,
      generalTierFlag: hvcc.generalTierFlag ? 1 : 0,
      generalLevelIdc: hvcc.generalLevelIdc,
      generalConstraintIndicatorFlags: new Uint8Array(hvcc.generalConstraintIndicatorFlags),
    },
  });

  // 4) Paint to canvas → PNG blob → swap <img> src
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height);
  ctx.putImageData(imageData, 0, 0);

  const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const objectUrl = URL.createObjectURL(pngBlob);

  // Keep original sizing attributes if set
  if (img.hasAttribute('width')) canvas.width = parseInt(img.getAttribute('width'), 10);
  if (img.hasAttribute('height')) canvas.height = parseInt(img.getAttribute('height'), 10);

  img.src = objectUrl;
  img.dataset.heicReplaced = 'true';
}

// Auto-upgrade all .heic images on the page
(async () => {
  if (typeof window.VideoDecoder === 'undefined') return; // no WebCodecs → skip or add your fallback
  const imgs = Array.from(document.querySelectorAll('img[src$=".HEIC"]'));
  for (const img of imgs) {
    try { await replaceHeicImg(img); }
    catch (err) { console.error('HEIC replace failed:', err); }
  }
})();
