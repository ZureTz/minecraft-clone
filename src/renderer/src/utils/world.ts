import { Matrix4 } from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { clamp } from "three/src/math/MathUtils.js";
import { RNG } from "./rng";

type BlockData = {
  id: number;
  instanceId: number;
};

type WorldData = BlockData[][][];

type BlockMatrixData = {
  id: number;
  instanceId: number;
  matrix: Matrix4;
};

export interface WorldParams {
  width: number;
  height: number;
  depth: number;
  terrain: {
    seed: number;
    scale: number;
    magnitude: number;
    offset: number;
  };
}

export class World {
  data: WorldData;

  // World dimensions
  width: number;
  height: number;
  depth: number;
  
  // Terrain parameters
  terrain: {
    seed: number;
    scale: number;
    magnitude: number;
    offset: number;
  };

  constructor(params: WorldParams) {
    this.width = params.width;
    this.height = params.height;
    this.depth = params.depth;
    this.terrain = params.terrain;

    // Initialize empty world data
    this.data = [];
  }

  // Initialize empty terrain
  initTerrain() {
    // Clear existing data
    this.data = [];

    // Initialize 3D array with empty blocks
    for (let x = 0; x < this.width; x++) {
      const slice = [];
      for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let z = 0; z < this.depth; z++) {
          row.push({ id: 0, instanceId: -1 }); // Empty block
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  // Terrain generation using Simplex noise
  generateTerrain() {
    this.initTerrain();

    const rng = new RNG(this.terrain.seed);
    const simplexGenerator = new SimplexNoise(rng);

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        // Calculate noise value for terrain height
        const noiseValue = simplexGenerator.noise(x / this.terrain.scale, z / this.terrain.scale);
        // Scale noise to world height
        const scaledNoise = this.terrain.offset + this.terrain.magnitude * noiseValue;
        // Clamp height to valid range and convert to integer
        const height = Math.floor(clamp(this.height * scaledNoise, 0, this.height - 1));

        // Fill blocks up to calculated height
        for (let y = 0; y <= height; y++) {
          this.setBlockId(x, y, z, 1); // Set block id to 1 (solid block)
        }
      }
    }
  }

  // Generate block matrices from world terrain data
  generateBlockMatrices(): BlockMatrixData[] {
    const blocks: BlockMatrixData[] = [];

    let instanceCounter = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          const blockId = this.getBlock(x, y, z)?.id;
          const instanceId = instanceCounter++;
          this.setBlockInstanceId(x, y, z, instanceId);

          // Skip empty blocks
          if (blockId === 0) continue;

          const matrix = new Matrix4();
          matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
          blocks.push({
            id: blockId,
            instanceId: instanceId,
            matrix: matrix
          });
        }
      }
    }
    return blocks;
  }

  // Main function to generate world
  generateWorld(): BlockMatrixData[] {
    this.generateTerrain();
    return this.generateBlockMatrices();
  }

  // Helpers

  // Check if the block at (x, y, z) is in bounds
  isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }

  // Get the block at (x, y, z), or null if out of bounds
  getBlock(x: number, y: number, z: number): BlockData | null {
    if (!this.isInBounds(x, y, z)) {
      return null;
    }
    return this.data[x][y][z];
  }

  // Set the block id at (x, y, z)
  setBlockId(x: number, y: number, z: number, id: number): void {
    if (!this.isInBounds(x, y, z)) {
      return;
    }
    this.data[x][y][z].id = id;
  }

  // Set the block instanceId at (x, y, z)
  setBlockInstanceId(x: number, y: number, z: number, instanceId: number): void {
    if (!this.isInBounds(x, y, z)) {
      return;
    }
    this.data[x][y][z].instanceId = instanceId;
  }
}
