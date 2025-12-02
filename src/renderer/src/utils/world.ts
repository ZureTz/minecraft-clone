import { Matrix4 } from "three";

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

export class World {
  width: number;
  height: number;
  depth: number;
  data: WorldData;

  threshold: number = 0.5; // Threshold for terrain height

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;

    // Initialize empty world data
    this.data = [];
  }

  // Simple terrain generation (flat ground with random hills)
  generateTerrain() {
    // Clear existing data
    this.data = [];

    for (let x = 0; x < this.width; x++) {
      const slice = [];
      for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let z = 0; z < this.depth; z++) {
          row.push({ id: Math.random() > this.threshold ? 1 : 0, instanceId: null });
        }
        slice.push(row);
      }
      this.data.push(slice);
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
