import { Color } from "three";

export enum BlockType {
  Empty = 0,
  Grass = 1,
  Dirt = 2
}

type Block = {
  id: number;
  name: string;
  color?: Color;
};

const Blocks: Record<number, Block> = {
  [BlockType.Empty]: { id: BlockType.Empty, name: "empty" },
  [BlockType.Grass]: { id: BlockType.Grass, name: "grass", color: new Color().setHex(0x3fab24) },
  [BlockType.Dirt]: { id: BlockType.Dirt, name: "dirt", color: new Color().setHex(0x5e4123) }
};

export function getBlockColor(id: number): Color {
  const block = Blocks[id];
  if (block && block.color) {
    return block.color;
  }
  return new Color(0xffffff); // Fallback (white color)
}
