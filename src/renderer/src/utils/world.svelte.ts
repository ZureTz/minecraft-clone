import { Matrix4, Vector3 } from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { clamp } from "three/src/math/MathUtils.js";

import { RNG } from "./rng";
import { BlockType, resources } from "./blocks";

type BlockData = {
  id: number;
  instanceId: number | null;
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
  height = $state(32);

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

  // Reusable objects to avoid GC pressure
  private _tempVector = new Vector3();

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
        Array.from({ length: this.depth }, () => ({ id: BlockType.Empty, instanceId: null }))
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
            data[x][y][z] = { id: resource.id, instanceId: null };
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
            data[x][y][z] = { id: BlockType.Empty, instanceId: null };
            continue;
          }

          // Set grass block at the surface
          if (y === height) {
            data[x][y][z] = { id: BlockType.Grass, instanceId: null };
            continue;
          }

          // Otherwise, y is below the surface
          // Fall back to dirt block
          data[x][y][z] = { id: BlockType.Dirt, instanceId: null };
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

          // Skip obscured blocks
          const isObscured =
            y < height - 1 &&
            y > 0 &&
            x < width - 1 &&
            x > 0 &&
            z < depth - 1 &&
            z > 0 &&
            data[x][y + 1][z].id !== BlockType.Empty &&
            data[x][y - 1][z].id !== BlockType.Empty &&
            data[x + 1][y][z].id !== BlockType.Empty &&
            data[x - 1][y][z].id !== BlockType.Empty &&
            data[x][y][z + 1].id !== BlockType.Empty &&
            data[x][y][z - 1].id !== BlockType.Empty;

          if (isObscured) {
            block.instanceId = null;
            continue;
          }

          const matrix = new Matrix4();
          matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);

          let instanceCount = 0;
          const addMatrix = (face: keyof WorldMatrices) => {
            if (!matrices[face][block.id]) {
              matrices[face][block.id] = [];
            }
            matrices[face][block.id].push(matrix);
            instanceCount++;
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

          // Set instance ID if any face was rendered
          block.instanceId = instanceCount > 0 ? instanceCount : null;
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

  getBlock(x: number, y: number, z: number) {
    if (!this.isInBounds(x, y, z)) return null;
    return this.data[x][y][z];
  }

  // Add a block at the specified position
  addBlock(x: number, y: number, z: number, blockId: number) {
    if (!this.isInBounds(x, y, z)) return false;
    if (!this.generation?.data) return false;

    const block = this.generation.data[x][y][z];
    if (block.id !== BlockType.Empty) return false; // Already occupied

    // Set the block
    block.id = blockId;

    // Add instance for this block
    this.addBlockInstance(x, y, z, blockId);

    // Hide specific faces of neighboring blocks if they are now obscured
    this.hideBlockFace(x - 1, y, z, "right"); // Left neighbor's right face
    this.hideBlockFace(x + 1, y, z, "left"); // Right neighbor's left face
    this.hideBlockFace(x, y - 1, z, "top"); // Bottom neighbor's top face
    this.hideBlockFace(x, y + 1, z, "bottom"); // Top neighbor's bottom face
    this.hideBlockFace(x, y, z - 1, "front"); // Back neighbor's front face
    this.hideBlockFace(x, y, z + 1, "back"); // Front neighbor's back face

    return true;
  } // Remove a block at the specified position
  removeBlock(x: number, y: number, z: number) {
    if (!this.isInBounds(x, y, z)) return false;
    if (!this.generation?.data) return false;

    const block = this.generation.data[x][y][z];
    if (block.id === BlockType.Empty) return false; // Already empty

    // Delete the instance
    this.deleteBlockInstance(x, y, z);

    // Set to empty
    block.id = BlockType.Empty;
    block.instanceId = null;

    // Reveal specific faces of neighboring blocks
    this.revealBlockFace(x - 1, y, z, "right"); // Left neighbor's right face
    this.revealBlockFace(x + 1, y, z, "left"); // Right neighbor's left face
    this.revealBlockFace(x, y - 1, z, "top"); // Bottom neighbor's top face
    this.revealBlockFace(x, y + 1, z, "bottom"); // Top neighbor's bottom face
    this.revealBlockFace(x, y, z - 1, "front"); // Back neighbor's front face
    this.revealBlockFace(x, y, z + 1, "back"); // Front neighbor's back face

    return true;
  } // Add a single block instance
  private addBlockInstance(x: number, y: number, z: number, blockId: number) {
    if (!this.generation?.data || !this.generation?.blocks) return;

    const block = this.generation.data[x][y][z];
    if (block.instanceId !== null) return; // Already has an instance

    const matrix = new Matrix4();
    matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);

    // Add to each visible face
    const faces: Array<keyof WorldMatrices> = ["top", "bottom", "left", "right", "front", "back"];
    for (const face of faces) {
      if (this.shouldRenderFace(x, y, z, face)) {
        if (!this.generation.blocks[face][blockId]) {
          this.generation.blocks[face][blockId] = [];
        }
        this.generation.blocks[face][blockId].push(matrix);
      }
    }

    // Store instance ID (use array length as ID)
    block.instanceId = this.generation.blocks.top[blockId]?.length ?? 0;
  }

  // Delete a single block instance
  private deleteBlockInstance(x: number, y: number, z: number) {
    if (!this.generation?.data || !this.generation?.blocks) return;

    const block = this.generation.data[x][y][z];
    if (block.instanceId === null) return; // No instance to delete

    const blockId = block.id;
    const targetX = x + 0.5;
    const targetY = y + 0.5;
    const targetZ = z + 0.5;

    // Remove from all faces
    const faces: Array<keyof WorldMatrices> = ["top", "bottom", "left", "right", "front", "back"];
    for (const face of faces) {
      const matrices = this.generation.blocks[face][blockId];
      if (matrices) {
        // Find and remove the matrix for this block - reuse temp vector
        const index = matrices.findIndex((m) => {
          this._tempVector.setFromMatrixPosition(m);
          return (
            Math.abs(this._tempVector.x - targetX) < 0.01 &&
            Math.abs(this._tempVector.y - targetY) < 0.01 &&
            Math.abs(this._tempVector.z - targetZ) < 0.01
          );
        });
        if (index !== -1) {
          matrices.splice(index, 1);
        }
      }
    }
  }

  // Check if a face should be rendered
  private shouldRenderFace(x: number, y: number, z: number, face: keyof WorldMatrices): boolean {
    if (!this.generation?.data) return false;

    const width = this.width;
    const height = this.height;
    const depth = this.depth;

    switch (face) {
      case "top":
        return y === height - 1 || this.generation.data[x][y + 1][z].id === BlockType.Empty;
      case "bottom":
        return y === 0 || this.generation.data[x][y - 1][z].id === BlockType.Empty;
      case "right":
        return x === width - 1 || this.generation.data[x + 1][y][z].id === BlockType.Empty;
      case "left":
        return x === 0 || this.generation.data[x - 1][y][z].id === BlockType.Empty;
      case "front":
        return z === depth - 1 || this.generation.data[x][y][z + 1].id === BlockType.Empty;
      case "back":
        return z === 0 || this.generation.data[x][y][z - 1].id === BlockType.Empty;
    }
  }

  // Reveal a specific face of a block
  private revealBlockFace(x: number, y: number, z: number, face: keyof WorldMatrices) {
    if (!this.isInBounds(x, y, z)) return;
    if (!this.generation?.data || !this.generation?.blocks) return;

    const block = this.generation.data[x][y][z];
    if (block.id === BlockType.Empty) return;

    // Check if this face should now be visible
    if (!this.shouldRenderFace(x, y, z, face)) return;

    const targetX = x + 0.5;
    const targetY = y + 0.5;
    const targetZ = z + 0.5;

    // Check if this face already exists - reuse temp vector
    const matrices = this.generation.blocks[face][block.id];
    if (matrices) {
      const exists = matrices.some((m) => {
        this._tempVector.setFromMatrixPosition(m);
        return (
          Math.abs(this._tempVector.x - targetX) < 0.01 &&
          Math.abs(this._tempVector.y - targetY) < 0.01 &&
          Math.abs(this._tempVector.z - targetZ) < 0.01
        );
      });
      if (exists) return; // Face already visible
    }

    // Add the face - create new matrix (unavoidable)
    const matrix = new Matrix4();
    matrix.setPosition(targetX, targetY, targetZ);

    if (!this.generation.blocks[face][block.id]) {
      this.generation.blocks[face][block.id] = [];
    }
    this.generation.blocks[face][block.id].push(matrix);

    // Update instance ID if it was null
    if (block.instanceId === null) {
      block.instanceId = 1;
    }
  }

  // Hide a specific face of a block
  private hideBlockFace(x: number, y: number, z: number, face: keyof WorldMatrices) {
    if (!this.isInBounds(x, y, z)) return;
    if (!this.generation?.data || !this.generation?.blocks) return;

    const block = this.generation.data[x][y][z];
    if (block.id === BlockType.Empty) return;

    // Check if this face should be hidden
    if (this.shouldRenderFace(x, y, z, face)) return; // Face should remain visible

    const targetX = x + 0.5;
    const targetY = y + 0.5;
    const targetZ = z + 0.5;

    // Remove the face - reuse temp vector
    const matrices = this.generation.blocks[face][block.id];
    if (matrices) {
      const index = matrices.findIndex((m) => {
        this._tempVector.setFromMatrixPosition(m);
        return (
          Math.abs(this._tempVector.x - targetX) < 0.01 &&
          Math.abs(this._tempVector.y - targetY) < 0.01 &&
          Math.abs(this._tempVector.z - targetZ) < 0.01
        );
      });
      if (index !== -1) {
        matrices.splice(index, 1);

        // If no more faces are visible, mark instance as null
        const allFaces: Array<keyof WorldMatrices> = [
          "top",
          "bottom",
          "left",
          "right",
          "front",
          "back"
        ];
        const hasAnyFace = allFaces.some((f) => {
          const faceMatrices = this.generation?.blocks[f][block.id];
          if (!faceMatrices) return false;
          return faceMatrices.some((m) => {
            this._tempVector.setFromMatrixPosition(m);
            return (
              Math.abs(this._tempVector.x - targetX) < 0.01 &&
              Math.abs(this._tempVector.y - targetY) < 0.01 &&
              Math.abs(this._tempVector.z - targetZ) < 0.01
            );
          });
        });
        if (!hasAnyFace) {
          block.instanceId = null;
        }
      }
    }
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
