import { Vector3 } from "three";
import { clamp } from "three/src/math/MathUtils.js";
import { BlockType } from "./blocks";
import type { World } from "./world.svelte";

export class Physics {
  gravity = 32;
  onGround = false;

  private radius = 0.4;
  private height = 2;
  private playerEyeHeight = 1.9;

  constructor(private world: World) {}

  // Check if the player at the given position collides with any solid block
  collides(position: Vector3): boolean {
    const bottomY = position.y - this.playerEyeHeight;
    const topY = bottomY + this.height;

    const minX = Math.floor(position.x - this.radius);
    const maxX = Math.floor(position.x + this.radius);
    const minY = Math.floor(bottomY);
    const maxY = Math.floor(topY);
    const minZ = Math.floor(position.z - this.radius);
    const maxZ = Math.floor(position.z + this.radius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          if (!block || block.id === BlockType.Empty) {
            continue;
          }

          // Check vertical overlap
          if (bottomY < y + 1 && topY > y) {
            // Check horizontal overlap (Circle vs Square)
            const closestX = clamp(position.x, x, x + 1);
            const closestZ = clamp(position.z, z, z + 1);

            const dx = position.x - closestX;
            const dz = position.z - closestZ;

            if (dx * dx + dz * dz < this.radius * this.radius) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Resolve collision by checking each axis independently
  resolveCollision(position: Vector3, velocity: Vector3, delta: number): Vector3 {
    this.onGround = false;
    const originalPos = position.clone();
    const nextPos = position.clone();

    // Try moving X
    nextPos.x += velocity.x * delta;
    if (this.collides(nextPos)) {
      nextPos.x = originalPos.x;
      velocity.x = 0;
    }

    // Try moving Y
    nextPos.y += velocity.y * delta;
    if (this.collides(nextPos)) {
      if (velocity.y < 0) {
        this.onGround = true;
      }
      nextPos.y = originalPos.y;
      velocity.y = 0;
    }

    // Try moving Z
    nextPos.z += velocity.z * delta;
    if (this.collides(nextPos)) {
      nextPos.z = originalPos.z;
      velocity.z = 0;
    }

    return nextPos;
  }
}
