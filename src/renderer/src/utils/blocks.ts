import { Color } from "three";

import coalOre from "../assets/textures/coal_ore.png";
import coalOreN from "../assets/textures/coal_ore_n.png";
import dirt from "../assets/textures/dirt.png";
import dirtN from "../assets/textures/dirt_n.png";
import grassSide from "../assets/textures/grass_side.png";
import grassSideOverlay from "../assets/textures/grass_side_overlay.png";
import grassSideOverlayN from "../assets/textures/grass_side_overlay_n.png";
import grassTop from "../assets/textures/grass_top.png";
import grassTopN from "../assets/textures/grass_top_n.png";
import ironOre from "../assets/textures/iron_ore.png";
import ironOreN from "../assets/textures/iron_ore_n.png";
import stone from "../assets/textures/stone.png";
import stoneN from "../assets/textures/stone_n.png";
import oakLog from "../assets/textures/oak_log.png";
import oakLogN from "../assets/textures/oak_log_n.png";
import oakLogTop from "../assets/textures/oak_log_top.png";
import oakLogTopN from "../assets/textures/oak_log_top_n.png";
import oakLeaves from "../assets/textures/oak_leaves.png";
import water from "../assets/textures/water_still.png";

export enum BlockType {
  Empty = 0,
  Grass = 1,
  Dirt = 2,
  Stone = 3,
  CoalOre = 4,
  IronOre = 5,
  OakLog = 6,
  OakLeaves = 7,
  Water = 8
}

type BlockTexture =
  | string
  | {
      top: string;
      side: string;
      sideOverlay?: string;
      bottom: string;
    };

type BlockNormalMap =
  | string
  | {
      top: string;
      side: string;
      sideOverlay?: string;
      bottom: string;
    };

type Block = {
  id: number;
  name: string;
  color?: Color;
  texture?: BlockTexture;
  normalMap?: BlockNormalMap;
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
    },
    normalMap: {
      top: grassTopN,
      side: dirtN,
      sideOverlay: grassSideOverlayN,
      bottom: dirtN
    }
  },
  [BlockType.Dirt]: {
    id: BlockType.Dirt,
    name: "dirt",
    color: new Color().setHex(0x5e4123),
    texture: dirt,
    normalMap: dirtN
  },
  [BlockType.Stone]: {
    id: BlockType.Stone,
    name: "stone",
    color: new Color().setHex(0x888888),
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    texture: stone,
    normalMap: stoneN
  },
  [BlockType.CoalOre]: {
    id: BlockType.CoalOre,
    name: "coal_ore",
    color: new Color().setHex(0x333333),
    scale: { x: 15, y: 15, z: 15 },
    scarcity: 0.8,
    texture: coalOre,
    normalMap: coalOreN
  },
  [BlockType.IronOre]: {
    id: BlockType.IronOre,
    name: "iron_ore",
    color: new Color().setHex(0xffa500),
    scale: { x: 10, y: 10, z: 10 },
    scarcity: 0.9,
    texture: ironOre,
    normalMap: ironOreN
  },
  [BlockType.OakLog]: {
    id: BlockType.OakLog,
    name: "oak_log",
    color: new Color().setHex(0x9c7f4e),
    texture: {
      top: oakLogTop,
      side: oakLog,
      bottom: oakLogTop
    },
    normalMap: {
      top: oakLogTopN,
      side: oakLogN,
      bottom: oakLogTopN
    }
  },
  [BlockType.OakLeaves]: {
    id: BlockType.OakLeaves,
    name: "oak_leaves",
    color: new Color().setHex(0x4f9e34),
    texture: oakLeaves
  },
  [BlockType.Water]: {
    id: BlockType.Water,
    name: "water",
    color: new Color().setHex(0x3f76e4),
    texture: water
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

export function getBlockNormalMap(id: number) {
  const block = Blocks[id];
  if (block && block.normalMap) {
    return block.normalMap;
  }
  return null;
}

export const resources: Block[] = [
  Blocks[BlockType.Stone],
  Blocks[BlockType.CoalOre],
  Blocks[BlockType.IronOre]
];
