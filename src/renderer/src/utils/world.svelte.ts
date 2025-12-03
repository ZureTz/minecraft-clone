import { Color, Matrix4 } from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { clamp } from "three/src/math/MathUtils.js";

import { RNG } from "./rng";
import { BlockType, getBlockColor } from "./blocks";

type BlockData = {
  id: number;
};

type WorldData = BlockData[][][];

type BlockMatrixData = {
  id: number;
  matrix: Matrix4;
  color: Color;
};

export interface WorldParams {
  width?: number;
  height?: number;
  depth?: number;
  terrain?: {
    seed?: number;
    scale?: number;
    magnitude?: number;
    offset?: number;
  };
}

export class World {
  // State using runes
  width = $state(64);
  depth = $state(64);
  height = $state(16);

  terrain = $state({
    seed: Math.round(Math.random() * 10000),
    scale: 48,
    magnitude: 0.5,
    offset: 0.5
  });

  constructor(params: WorldParams = {}) {
    if (params.width) this.width = params.width;
    if (params.height) this.height = params.height;
    if (params.depth) this.depth = params.depth;
    if (params.terrain) {
      if (params.terrain.seed !== undefined) this.terrain.seed = params.terrain.seed;
      if (params.terrain.scale !== undefined) this.terrain.scale = params.terrain.scale;
      if (params.terrain.magnitude !== undefined) this.terrain.magnitude = params.terrain.magnitude;
      if (params.terrain.offset !== undefined) this.terrain.offset = params.terrain.offset;
    }
  }

  // Derived state: The generated world data and matrices
  // This will automatically re-calculate whenever any dependency (width, height, terrain) changes.
  generation = $derived.by(() => {
    const data: WorldData = [];
    const blocks: BlockMatrixData[] = [];

    // 1. Initialize Data
    for (let x = 0; x < this.width; x++) {
      const slice: BlockData[][] = [];
      for (let y = 0; y < this.height; y++) {
        const row: BlockData[] = [];
        for (let z = 0; z < this.depth; z++) {
          row.push({ id: BlockType.Empty });
        }
        slice.push(row);
      }
      data.push(slice);
    }

    // 2. Generate Terrain
    const rng = new RNG(this.terrain.seed);
    const simplexGenerator = new SimplexNoise(rng);

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        // Calculate noise value for terrain height
        const noiseValue = simplexGenerator.noise(x / this.terrain.scale, z / this.terrain.scale);
        // Scale noise value based on terrain parameters
        const scaledNoise = this.terrain.offset + this.terrain.magnitude * noiseValue;
        // Determine height of terrain at this point
        const height = Math.floor(clamp(this.height * scaledNoise, 0, this.height - 1));

        // Set blocks up to the calculated height
        for (let y = 0; y <= this.height; y++) {
          if (y === height) {
            data[x][y][z] = { id: BlockType.Grass };
            continue;
          }
          if (y < height) {
            data[x][y][z] = { id: BlockType.Dirt };
            continue;
          }
        }
      }
    }

    // 3. Generate Matrices
    const width = this.width;
    const height = this.height;
    const depth = this.depth;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          const block = data[x][y][z];

          // Skip empty blocks
          if (block.id === BlockType.Empty) continue;

          // Check for visibility (exposed faces)
          // A block is visible if any of its neighbors are empty or out of bounds
          let visible = false;

          // Top
          if (y === height - 1 || data[x][y + 1][z].id === BlockType.Empty) visible = true;
          // Bottom
          else if (y === 0 || data[x][y - 1][z].id === BlockType.Empty) visible = true;
          // Right (+x)
          else if (x === width - 1 || data[x + 1][y][z].id === BlockType.Empty) visible = true;
          // Left (-x)
          else if (x === 0 || data[x - 1][y][z].id === BlockType.Empty) visible = true;
          // Front (+z)
          else if (z === depth - 1 || data[x][y][z + 1].id === BlockType.Empty) visible = true;
          // Back (-z)
          else if (z === 0 || data[x][y][z - 1].id === BlockType.Empty) visible = true;

          if (!visible) continue;

          const matrix = new Matrix4();
          matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
          blocks.push({
            id: block.id,
            matrix: matrix,
            color: getBlockColor(block.id)
          });
        }
      }
    }

    return { data, blocks };
  });

  // Getters to access the derived data
  get data() {
    return this.generation.data;
  }

  get matrices() {
    return this.generation.blocks;
  }

  // Helpers
  isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }
}
