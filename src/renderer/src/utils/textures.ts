import { useTexture } from "@threlte/extras";
import { NearestFilter, Texture } from "three";

import { BlockType, getBlockTexture } from "./blocks";

/**
 * Compose two textures together, tinting the overlay with the specified color
 * @param base - The base texture (e.g., dirt)
 * @param overlay - The overlay texture to tint and composite (e.g., grass overlay)
 * @param colorHex - The hex color to tint the overlay
 * @returns A new composed texture
 */
export function composeTextures(base: Texture, overlay: Texture, colorHex: string): Texture {
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
  texture.colorSpace = "srgb";
  texture.needsUpdate = true;
  return texture;
}

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
    else texture = txts.grassSideComposite || txts.grassSide;
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
    texture.colorSpace = "srgb";
  }

  return texture;
}

// Grass block color constant
export const GRASS_COLOR = "#3fab24";

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

// Type for grass texture paths
export type GrassTexturePaths = {
  top: string;
  side: string;
  sideOverlay: string;
  bottom: string;
};

/**
 * Load all block textures and compose composite textures
 * @returns A promise that resolves to the loaded and composed textures
 */
export async function loadBlockTextures(): Promise<Record<string, Texture>> {
  const grassTexture = getBlockTexture(BlockType.Grass) as GrassTexturePaths;

  const txts = await useTexture({
    grassTop: grassTexture.top,
    grassSide: grassTexture.side,
    grassSideOverlay: grassTexture.sideOverlay,
    dirt: getBlockTexture(BlockType.Dirt) as string,
    stone: getBlockTexture(BlockType.Stone) as string,
    coalOre: getBlockTexture(BlockType.CoalOre) as string,
    ironOre: getBlockTexture(BlockType.IronOre) as string
  });
  const composite = composeTextures(txts.grassSide, txts.grassSideOverlay, GRASS_COLOR);
  return {
    ...txts,
    grassSideComposite: composite
  };
}
