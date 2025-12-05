import { Matrix4 } from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { clamp } from "three/src/math/MathUtils.js";

import { RNG } from "./rng";
import { BlockType, resources } from "./blocks";

type BlockData = {
  id: number;
};

type WorldData = BlockData[][][];

type WorldMatrices = {
  top: Record<number, Matrix4[]>;
  bottom: Record<number, Matrix4[]>;
  left: Record<number, Matrix4[]>;
  right: Record<number, Matrix4[]>;
  front: Record<number, Matrix4[]>;
  back: Record<number, Matrix4[]>;
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
  width = $state(256);
  depth = $state(256);
  height = $state(48);

  // Generation state
  isGenerating = $state(true);
  generation = $state<{ data: WorldData; blocks: WorldMatrices } | null>(null);

  private terrain = $state({
    seed: Math.round(Math.random() * 10000),
    scale: 60,
    magnitude: 0.3,
    offset: 0.5
  });

  private rng = $derived(new RNG(this.terrain.seed));
  private simplexGenerator = $derived(new SimplexNoise(this.rng));

  private resources = $state(
    resources.reduce(
      (acc, resource) => {
        acc[resource.id] = {
          ...resource,
          scale: { ...resource.scale }, // Deep copy scale
          scarcity: resource.scarcity
        };
        return acc;
      },
      {} as Record<number, any>
    )
  );

  constructor(params: WorldParams = {}) {
    if (params.width) this.width = params.width;
    if (params.height) this.height = params.height;
    if (params.depth) this.depth = params.depth;
    if (params.terrain) {
      if (params.terrain.seed) this.terrain.seed = params.terrain.seed;
      if (params.terrain.scale) this.terrain.scale = params.terrain.scale;
      if (params.terrain.magnitude) this.terrain.magnitude = params.terrain.magnitude;
      if (params.terrain.offset) this.terrain.offset = params.terrain.offset;
    }

    $effect(() => {
      // Track dependencies
      this.width;
      this.height;
      this.depth;
      this.terrain.seed;
      this.terrain.scale;
      this.terrain.magnitude;
      this.terrain.offset;

      // Read resources to track changes
      Object.values(this.resources).forEach((r) => {
        r.scarcity;
        r.scale.x;
        r.scale.y;
        r.scale.z;
      });

      this.generate();
    });
  }

  async generate() {
    this.isGenerating = true;

    // Yield to allow UI updates
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Generation Steps
    const data = this.initializeData();
    this.generateTerrain(data);
    this.generateResources(data);
    const blocks = this.generateMatrices(data);

    this.isGenerating = false;
    this.generation = { data, blocks };
  }

  // 1. Initialize Data
  initializeData(): WorldData {
    return Array.from({ length: this.width }, () =>
      Array.from({ length: this.height }, () =>
        Array.from({ length: this.depth }, () => ({ id: BlockType.Empty }))
      )
    );
  }

  // 2. Generate Resources
  generateResources(data: WorldData) {
    const resources = Object.values(this.resources);
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          // Optimization: Skip if block is Empty (air)
          if (data[x][y][z].id === BlockType.Empty) continue;
          // Optimization: Skip if block is Grass (surface)
          if (data[x][y][z].id === BlockType.Grass) continue;

          for (const resource of resources) {
            const noiseScale = resource.scale;
            const scarcity = resource.scarcity;
            if (!noiseScale || !scarcity) continue;

            // Calculate noise value for resource placement
            const noiseValue = this.simplexGenerator.noise3d(
              x / noiseScale.x,
              y / noiseScale.y,
              z / noiseScale.z
            );

            // Skip placement based on scarcity
            if (noiseValue < scarcity) {
              continue;
            }
            data[x][y][z] = { id: resource.id };
            // Once a resource is placed, stop checking other resources for this block
            // (Assuming resources are mutually exclusive and order defines priority)
            break;
          }
        }
      }
    }
  }

  // 3. Generate Terrain
  generateTerrain(data: WorldData) {
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        // Calculate noise value for terrain height
        const noiseValue = this.simplexGenerator.noise(
          x / this.terrain.scale,
          z / this.terrain.scale
        );
        // Scale noise value based on terrain parameters
        const scaledNoise = this.terrain.offset + this.terrain.magnitude * noiseValue;
        // Determine height of terrain at this point
        const height = Math.floor(clamp(this.height * scaledNoise, 0, this.height - 1));

        // Set blocks up to the calculated height
        for (let y = 0; y < this.height; y++) {
          // Set all blocks above height to empty
          if (y > height) {
            data[x][y][z] = { id: BlockType.Empty };
            continue;
          }

          // Set grass block at the surface
          if (y === height) {
            data[x][y][z] = { id: BlockType.Grass };
            continue;
          }

          // Otherwise, y is below the surface
          // Fall back to dirt block
          data[x][y][z] = { id: BlockType.Dirt };
        }
      }
    }
  }

  // 4. Generate Matrices
  generateMatrices(data: WorldData): WorldMatrices {
    const matrices: WorldMatrices = {
      top: {},
      bottom: {},
      left: {},
      right: {},
      front: {},
      back: {}
    };

    const width = this.width;
    const height = this.height;
    const depth = this.depth;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          const block = data[x][y][z];

          // Skip empty blocks
          if (block.id === BlockType.Empty) continue;

          const matrix = new Matrix4();
          matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);

          const addMatrix = (face: keyof WorldMatrices) => {
            if (!matrices[face][block.id]) {
              matrices[face][block.id] = [];
            }
            matrices[face][block.id].push(matrix);
          };

          // Top
          if (y === height - 1 || data[x][y + 1][z].id === BlockType.Empty) {
            addMatrix("top");
          }
          // Bottom
          if (y === 0 || data[x][y - 1][z].id === BlockType.Empty) {
            addMatrix("bottom");
          }
          // Right (+x)
          if (x === width - 1 || data[x + 1][y][z].id === BlockType.Empty) {
            addMatrix("right");
          }
          // Left (-x)
          if (x === 0 || data[x - 1][y][z].id === BlockType.Empty) {
            addMatrix("left");
          }
          // Front (+z)
          if (z === depth - 1 || data[x][y][z + 1].id === BlockType.Empty) {
            addMatrix("front");
          }
          // Back (-z)
          if (z === 0 || data[x][y][z - 1].id === BlockType.Empty) {
            addMatrix("back");
          }
        }
      }
    }
    return matrices;
  }

  // Getters to access the derived data
  get data() {
    return this.generation?.data ?? [];
  }

  get matrices() {
    return (
      this.generation?.blocks ?? {
        top: {},
        bottom: {},
        left: {},
        right: {},
        front: {},
        back: {}
      }
    );
  }

  // Helpers
  isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }

  getUIParams() {
    const resourcesCopy = Object.values(this.resources).reduce(
      (acc, resource: any) => {
        acc[resource.id] = {
          ...resource,
          scale: { ...resource.scale }
        };
        return acc;
      },
      {} as Record<number, any>
    );

    return {
      width: this.width,
      height: this.height,
      terrain: { ...this.terrain },
      resources: resourcesCopy
    };
  }

  updateParam(key: string, value: number) {
    // Update the corresponding parameter based on the key
    if (key === "width") {
      this.width = value;
      this.depth = value;
    }
    if (key === "height") this.height = value;

    if (key === "terrain.seed") this.terrain.seed = value;
    if (key === "terrain.scale") this.terrain.scale = value;
    if (key === "terrain.magnitude") this.terrain.magnitude = value;
    if (key === "terrain.offset") this.terrain.offset = value;

    if (key.startsWith("resources.")) {
      const parts = key.split(".");
      const resourceId = parseInt(parts[1]);
      const property = parts[2];

      if (property === "scarcity") {
        this.resources[resourceId].scarcity = value;
      } else if (property === "scale") {
        const axis = parts[3];
        this.resources[resourceId].scale[axis] = value;
      }
    }
  }
}
