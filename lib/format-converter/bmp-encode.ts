/** 24-bit uncompressed BMP (BGR, bottom-up rows). */
export function rgbaToBmpBlob(rgba: Uint8ClampedArray, width: number, height: number): Blob {
  const rowSize = ((width * 3 + 3) >> 2) << 2;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const u8 = new Uint8Array(buf);

  u8[0] = 0x42;
  u8[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelDataSize, true);

  let o = 54;
  for (let y = height - 1; y >= 0; y -= 1) {
    let p = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      u8[o] = rgba[p + 2] ?? 0;
      u8[o + 1] = rgba[p + 1] ?? 0;
      u8[o + 2] = rgba[p] ?? 0;
      o += 3;
      p += 4;
    }
    const pad = rowSize - width * 3;
    for (let k = 0; k < pad; k += 1) {
      u8[o] = 0;
      o += 1;
    }
  }

  return new Blob([buf], { type: "image/bmp" });
}
