declare module "utif" {
  type Ifd = Record<string, unknown> & {
    width?: number;
    height?: number;
    data?: Uint8Array;
  };

  interface UTIFStatic {
    decode(buffer: ArrayBuffer): Ifd[];
    decodeImage(buffer: ArrayBuffer, ifd: Ifd): void;
    toRGBA8(ifd: Ifd): Uint8Array;
    encodeImage(
      rgba: ArrayBuffer | Uint8Array | Uint8ClampedArray,
      w: number,
      h: number,
      metadata?: Record<string, unknown>,
    ): ArrayBuffer;
  }

  const UTIF: UTIFStatic;
  export default UTIF;
}
