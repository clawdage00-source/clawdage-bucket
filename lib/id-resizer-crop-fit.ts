import { getInitialCropFromCroppedAreaPixels, type MediaSize } from "react-easy-crop";

export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/** Mirrors react-easy-crop internal sizing so helpers stay consistent. */
export function getCropSize(
  mediaWidth: number,
  mediaHeight: number,
  containerWidth: number,
  containerHeight: number,
  aspect: number,
  rotation = 0,
): { width: number; height: number } {
  const { width, height } = rotateSize(mediaWidth, mediaHeight, rotation);
  const fittingWidth = Math.min(width, containerWidth);
  const fittingHeight = Math.min(height, containerHeight);
  if (fittingWidth > fittingHeight * aspect) {
    return { width: fittingHeight * aspect, height: fittingHeight };
  }
  return { width: fittingWidth, height: fittingWidth / aspect };
}

/**
 * Crop + zoom so the selection covers the entire uploaded bitmap (best for pre-cropped ID scans).
 * Uses react-easy-crop’s inverse mapping from a full-image pixel rect.
 */
export function computeFitFullImageCrop(
  mediaSize: MediaSize,
  containerWidth: number,
  containerHeight: number,
  aspect: number,
  minZoom: number,
  maxZoom: number,
  rotation = 0,
): { crop: { x: number; y: number }; zoom: number } {
  const cropSize = getCropSize(
    mediaSize.width,
    mediaSize.height,
    containerWidth,
    containerHeight,
    aspect,
    rotation,
  );
  const bbox = rotateSize(mediaSize.naturalWidth, mediaSize.naturalHeight, rotation);
  const croppedAreaPixels = {
    x: 0,
    y: 0,
    width: bbox.width,
    height: bbox.height,
  };
  return getInitialCropFromCroppedAreaPixels(croppedAreaPixels, mediaSize, rotation, cropSize, minZoom, maxZoom);
}
