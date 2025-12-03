import { Color } from "three";

import coalOre from "../assets/textures/coal_ore.png";
import dirt from "../assets/textures/dirt.png";
import grassSide from "../assets/textures/grass_side.png";
import grassSideOverlay from "../assets/textures/grass_side_overlay.png";
import grassTop from "../assets/textures/grass_top.png";
import ironOre from "../assets/textures/iron_ore.png";
import stone from "../assets/textures/stone.png";

export enum BlockType {
  Empty = 0,
  Grass = 1,
  Dirt = 2,
  Stone = 3,
  CoalOre = 4,
  IronOre = 5
}

type Block = {
  id: number;
  name: string;
  color?: Color;
  texture?:
    | string
    | {
        top: string;
        side: string;
        sideOverlay?: string;
        bottom: string;
      };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
  scarcity?: number;
};

export const Blocks: Record<number, Block> = {
  [BlockType.Empty]: { id: BlockType.Empty, name: "empty" },
  [BlockType.Grass]: {
    id: BlockType.Grass,
    name: "grass",
    color: new Color().setHex(0x3fab24),
    texture: {
      top: grassTop,
      side: grassSide,
      sideOverlay: grassSideOverlay,
      bottom: dirt
    }
  },
  [BlockType.Dirt]: {
    id: BlockType.Dirt,
    name: "dirt",
    color: new Color().setHex(0x5e4123),
    texture: dirt
  },
  [BlockType.Stone]: {
    id: BlockType.Stone,
    name: "stone",
    color: new Color().setHex(0x888888),
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    texture: stone
  },
  [BlockType.CoalOre]: {
    id: BlockType.CoalOre,
    name: "coal_ore",
    color: new Color().setHex(0x333333),
    scale: { x: 15, y: 15, z: 15 },
    scarcity: 0.8,
    texture: coalOre
  },
  [BlockType.IronOre]: {
    id: BlockType.IronOre,
    name: "iron_ore",
    color: new Color().setHex(0xffa500),
    scale: { x: 10, y: 10, z: 10 },
    scarcity: 0.9,
    texture: ironOre
  }
};

export function getBlockColor(id: number): Color {
  const block = Blocks[id];
  if (block && block.color) {
    return block.color;
  }
  return new Color(0xffffff); // Fallback (white color)
}

export function getBlockTexture(id: number) {
  const block = Blocks[id];
  if (block && block.texture) {
    return block.texture;
  }
  return null;
}

export const resources: Block[] = [
  Blocks[BlockType.Stone],
  Blocks[BlockType.CoalOre],
  Blocks[BlockType.IronOre]
];
