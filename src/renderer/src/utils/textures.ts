import { useTexture } from "@threlte/extras";
import { NearestFilter, NoColorSpace, SRGBColorSpace, Texture } from "three";

import { BlockType, getBlockNormalMap, getBlockTexture } from "./blocks";

/**
 * Get the appropriate texture for a block face
 * @param id - The block type ID
 * @param face - The face direction (top, bottom, front, back, left, right)
 * @param txts - The loaded textures record
 * @returns The texture for the specified block face, or null if not found
 */
export function getTexture(
  id: number,
  face: string,
  txts: Record<string, Texture>
): Texture | null {
  if (!txts) return null;

  let texture: Texture | null = null;

  if (id === BlockType.Grass) {
    if (face === "top") texture = txts.grassTop;
    else if (face === "bottom") texture = txts.dirt;
    else texture = txts.grassSideComposite || txts.dirt;
  } else if (id === BlockType.Dirt) {
    texture = txts.dirt;
  } else if (id === BlockType.Stone) {
    texture = txts.stone;
  } else if (id === BlockType.CoalOre) {
    texture = txts.coalOre;
  } else if (id === BlockType.IronOre) {
    texture = txts.ironOre;
  }

  if (texture) {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.colorSpace = SRGBColorSpace;
  }

  return texture;
}

/**
 * Get the appropriate normal map for a block face
 * @param id - The block type ID
 * @param face - The face direction (top, bottom, front, back, left, right)
 * @param txts - The loaded textures record
 * @returns The normal map for the specified block face, or null if not found
 */
export function getNormalMap(
  id: number,
  face: string,
  txts: Record<string, Texture>
): Texture | null {
  if (!txts) return null;

  let normalMap: Texture | null = null;

  if (id === BlockType.Grass) {
    if (face === "top") normalMap = txts.grassTopN;
    else if (face === "bottom") normalMap = txts.dirtN;
    else normalMap = txts.grassSideCompositeN || txts.dirtN;
  } else if (id === BlockType.Dirt) {
    normalMap = txts.dirtN;
  } else if (id === BlockType.Stone) {
    normalMap = txts.stoneN;
  } else if (id === BlockType.CoalOre) {
    normalMap = txts.coalOreN;
  } else if (id === BlockType.IronOre) {
    normalMap = txts.ironOreN;
  }

  if (normalMap) {
    normalMap.magFilter = NearestFilter;
    normalMap.minFilter = NearestFilter;
    normalMap.colorSpace = NoColorSpace;
  }

  return normalMap;
}

// Grass block color constant
const GRASS_COLOR = "#3fab24";

/**
 * Get the tint color for a block face
 * @param id - The block type ID
 * @param face - The face direction
 * @returns The hex color string for tinting, or undefined if no tint needed
 */
export function getBlockColor(id: number, face: string): string | undefined {
  if (id === BlockType.Grass && face === "top") {
    return GRASS_COLOR;
  }
  return undefined;
}

/**
 * Load all block textures and compose composite textures
 * @returns A promise that resolves to the loaded and composed textures
 */
export async function loadBlockTextures(): Promise<Record<string, Texture>> {
  // Type for grass texture paths
  type GrassTexturePaths = {
    top: string;
    side: string;
    sideOverlay: string;
    bottom: string;
  };

  // Type for grass normal map paths
  type GrassNormalMapPaths = {
    top: string;
    side: string;
    sideOverlay: string;
    bottom: string;
  };

  const grassTexture = getBlockTexture(BlockType.Grass) as GrassTexturePaths;
  const grassNormalMap = getBlockNormalMap(BlockType.Grass) as GrassNormalMapPaths;

  const txts = await useTexture({
    // Color textures
    grassTop: grassTexture.top,
    grassSideOverlay: grassTexture.sideOverlay,
    dirt: getBlockTexture(BlockType.Dirt) as string,
    stone: getBlockTexture(BlockType.Stone) as string,
    coalOre: getBlockTexture(BlockType.CoalOre) as string,
    ironOre: getBlockTexture(BlockType.IronOre) as string,
    // Normal maps
    grassTopN: grassNormalMap.top,
    grassSideOverlayN: grassNormalMap.sideOverlay,
    dirtN: grassNormalMap.bottom,
    stoneN: getBlockNormalMap(BlockType.Stone) as string,
    coalOreN: getBlockNormalMap(BlockType.CoalOre) as string,
    ironOreN: getBlockNormalMap(BlockType.IronOre) as string
  });

  // Create composite color texture - use dirt as base for consistent color
  const composite = composeTextures(txts.dirt, txts.grassSideOverlay, GRASS_COLOR);

  // Create composite normal map
  const compositeN = composeNormalMaps(txts.dirtN, txts.grassSideOverlayN, txts.grassSideOverlay);

  // Enforce correct color spaces for all loaded textures
  Object.entries(txts).forEach(([key, texture]) => {
    if (key.endsWith("N")) {
      texture.colorSpace = NoColorSpace;
    } else {
      texture.colorSpace = SRGBColorSpace;
    }
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.needsUpdate = true;
  });

  return {
    ...txts,
    grassSideComposite: composite,
    grassSideCompositeN: compositeN
  };
}

/**
 * Compose two normal maps together
 * @param base - The base normal map
 * @param overlay - The overlay normal map
 * @param overlayColor - The overlay color texture (used for alpha mask)
 * @returns A new composed normal map
 */
function composeNormalMaps(base: Texture, overlay: Texture, overlayColor: Texture): Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return base;

  const baseImage = base.image as HTMLImageElement;
  const overlayImage = overlay.image as HTMLImageElement;
  const overlayColorImage = overlayColor.image as HTMLImageElement;
  const width = baseImage.width;
  const height = baseImage.height;
  canvas.width = width;
  canvas.height = height;

  // Draw base normal map
  ctx.drawImage(baseImage, 0, 0);

  // Create a temp canvas for the overlay with alpha mask
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext("2d");

  if (overlayCtx) {
    overlayCtx.drawImage(overlayImage, 0, 0);

    // Use destination-in to apply overlayColor's alpha as mask
    overlayCtx.globalCompositeOperation = "destination-in";
    overlayCtx.drawImage(overlayColorImage, 0, 0);

    // Draw overlay onto main canvas
    ctx.drawImage(overlayCanvas, 0, 0);
  }

  const texture = new Texture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Compose two textures together, tinting the overlay with the specified color
 * @param base - The base texture (e.g., dirt)
 * @param overlay - The overlay texture to tint and composite (e.g., grass overlay)
 * @param colorHex - The hex color to tint the overlay
 * @returns A new composed texture
 */
function composeTextures(base: Texture, overlay: Texture, colorHex: string): Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return base;

  const baseImage = base.image as HTMLImageElement;
  const overlayImage = overlay.image as HTMLImageElement;
  const width = baseImage.width;
  const height = baseImage.height;
  canvas.width = width;
  canvas.height = height;

  // Draw base (dirt)
  ctx.drawImage(baseImage, 0, 0);

  // Prepare overlay (tinted with multiply to preserve brightness variations)
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext("2d");
  if (overlayCtx) {
    // First draw the overlay
    overlayCtx.drawImage(overlayImage, 0, 0);

    // Apply color tint using multiply blend mode (preserves brightness variations)
    overlayCtx.globalCompositeOperation = "multiply";
    overlayCtx.fillStyle = colorHex;
    overlayCtx.fillRect(0, 0, width, height);

    // Restore alpha from original overlay
    overlayCtx.globalCompositeOperation = "destination-in";
    overlayCtx.drawImage(overlayImage, 0, 0);

    // Draw tinted overlay onto main canvas
    ctx.drawImage(overlayCanvas, 0, 0);
  }

  const texture = new Texture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
