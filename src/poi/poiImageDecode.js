// @ts-check
// POI-2 (2026-10-14): A POI'S PICTURE, DECODED BY THE BROWSER THAT DRAWS IT - a PNG, JPEG or WebP (poi/poiImage.js knew
// it by its header before it was stored) to an RGBA raster, TOP row first, as a browser decodes one; poi/poiRuntime.js
// bakeAlbedo turns it to the port's color32 order. The pixels as stored: no premultiplied alpha (a cutout's edge and a
// glass's alpha are the file's own) and no colour-space conversion (the file's numbers are the material's). A canvas
// made to be read is asked for as one (systems/textureReplacement.js decodePng's FIELD 2026-09-27 lesson).

/** @param {Uint8Array} bytes @returns {Promise<{ width: number, height: number, data: Uint8Array }>} */
export async function decodePoiImage(bytes) {
  // a copy the Blob owns (a view over a shared or larger buffer is not a BlobPart)
  const bmp = await createImageBitmap(new Blob([bytes.slice()]), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  try {
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('poi image: no 2d context');
    ctx.drawImage(bmp, 0, 0);
    const img = ctx.getImageData(0, 0, bmp.width, bmp.height);
    return { width: img.width, height: img.height, data: new Uint8Array(img.data.buffer) };
  } finally {
    bmp.close?.();
  }
}
