import { PerspectiveCamera, Vector3, Raycaster } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Physics } from "./physics";
import type { World } from "./world.svelte";
import { BlockType } from "./blocks";

export class PlayerController {
  // Movement state
  moveForward = $state(false);
  moveBackward = $state(false);
  moveLeft = $state(false);
  moveRight = $state(false);
  moveUp = $state(false);
  moveDown = $state(false);

  // Physics parameters
  moveSpeed = $state(1); // Units per second
  defaultAcceleration = $derived(this.moveSpeed * 60); // Approx conversion for feel
  damping = $state(10);
  // Sprint state
  isSprinting = $state(false);
  // Camera FOV (will change when sprinting)
  defaultFov = 75;
  sprintFovAddFactor = 15;
  fov = $state(this.defaultFov);

  // Raycasting for block interaction
  raycaster = new Raycaster();
  maxReach = 8; // Max distance to interact with blocks

  // Highlighted block state
  highlightedBlock = $state<{ x: number; y: number; z: number; face: string } | null>(null);

  // Selected block type for placement
  selectedBlockType = $state(BlockType.Dirt);
  placableBlockTypes = [
    BlockType.Dirt,
    BlockType.Grass,
    BlockType.Stone,
    BlockType.CoalOre,
    BlockType.IronOre
  ];

  // Internal physics state
  velocity = new Vector3();
  direction = new Vector3();
  controls: PointerLockControls | null = null;
  physics: Physics | null = null;
  world: World | null = null;

  constructor() {}

  init(camera: PerspectiveCamera, domElement: HTMLElement, world: World) {
    this.controls = new PointerLockControls(camera, domElement);
    this.physics = new Physics(world);
    this.world = world;

    // Set spawn position
    const spawnX = world.width / 2;
    const spawnZ = world.depth / 2;
    const spawnY = world.height + 10;
    camera.position.set(spawnX, spawnY, spawnZ);
  }

  dispose() {
    this.controls?.dispose();
  }

  lock() {
    this.controls?.lock();
  }

  resetPosition() {
    if (!this.controls || !this.world) return;
    const camera = this.controls.object;
    const spawnX = this.world.width / 2;
    const spawnZ = this.world.depth / 2;
    const spawnY = this.world.height + 10;
    camera.position.set(spawnX, spawnY, spawnZ);
    this.velocity.set(0, 0, 0);
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = true;
        break;
      case "Space":
        this.moveUp = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = true;
        break;
      case "ControlLeft":
        if (this.moveForward) {
          this.isSprinting = !this.isSprinting;
        }
        break;
      case "KeyR":
        this.resetPosition();
        break;
      // Number keys for block selection
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
      case "Digit6":
      case "Digit7":
      case "Digit8":
      case "Digit9":
        const index = parseInt(event.code.replace("Digit", "")) - 1;
        if (index < this.placableBlockTypes.length) {
          this.selectedBlockType = this.placableBlockTypes[index];
        }
        break;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = false;
        this.isSprinting = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = false;
        break;
      case "Space":
        this.moveUp = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = false;
        break;
    }
  }

  update(delta: number) {
    // if (!this.controls?.isLocked) return;
    if (!this.physics) return;

    // Update raycasting
    this.updateRaycast();

    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    // Apply damping
    this.velocity.x -= this.velocity.x * this.damping * delta;
    this.velocity.z -= this.velocity.z * this.damping * delta;

    // Apply Gravity
    this.velocity.y -= this.physics.gravity * delta;

    // Jumping
    if (this.moveUp && this.physics.onGround) {
      this.velocity.y = 10;
    }

    // Smooth FOV transition
    const targetFov = this.isSprinting
      ? this.defaultFov + this.sprintFovAddFactor
      : this.defaultFov;
    this.fov += (targetFov - this.fov) * 10 * delta;

    // Calculate acceleration
    // Only apply sprint acceleration if moving forward
    const currentAcceleration =
      this.isSprinting && this.moveForward
        ? this.defaultAcceleration * 1.5
        : this.defaultAcceleration;

    // Apply acceleration (Less acceleration when not on ground)
    if (this.moveForward || this.moveBackward) {
      this.velocity.z +=
        this.direction.z *
        (this.physics.onGround ? currentAcceleration : currentAcceleration * 0.7) *
        delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x +=
        this.direction.x *
        (this.physics.onGround ? this.defaultAcceleration : this.defaultAcceleration * 0.7) *
        delta;
    }

    // Convert local velocity to world velocity
    const camera = this.controls.object;
    const forward = new Vector3();
    const right = new Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const worldVelocity = new Vector3();
    worldVelocity.addScaledVector(right, this.velocity.x);
    worldVelocity.addScaledVector(forward, this.velocity.z);
    worldVelocity.y = this.velocity.y;

    // Apply movement with collision detection
    const newPos = this.physics.resolveCollision(camera.position, worldVelocity, delta);
    camera.position.copy(newPos);

    // Update local vertical velocity if collision stopped it
    this.velocity.y = worldVelocity.y;
  }

  getPosition() {
    if (!this.controls) return { x: 0, y: 0, z: 0 };
    return {
      x: Math.round(this.controls.object.position.x),
      y: Math.round(this.controls.object.position.y),
      z: Math.round(this.controls.object.position.z)
    };
  }

  // Raycast to detect block the player is looking at
  private updateRaycast() {
    if (!this.controls || !this.world) return;

    const camera = this.controls.object as PerspectiveCamera;

    // Get ray direction from camera
    const direction = new Vector3();
    camera.getWorldDirection(direction);

    // Set up raycaster with camera position and direction
    this.raycaster.set(camera.position, direction);

    // Check each block for intersection
    let closestDistance = Infinity;
    let closestBlock: { x: number; y: number; z: number; face: string } | null = null;

    const checkRadius = Math.ceil(this.maxReach);
    const px = Math.floor(camera.position.x);
    const py = Math.floor(camera.position.y);
    const pz = Math.floor(camera.position.z);

    for (let x = px - checkRadius; x <= px + checkRadius; x++) {
      for (let y = py - checkRadius; y <= py + checkRadius; y++) {
        for (let z = pz - checkRadius; z <= pz + checkRadius; z++) {
          if (!this.world.isInBounds(x, y, z)) continue;

          const block = this.world.getBlock(x, y, z);
          if (!block || block.id === BlockType.Empty) continue;

          // Check distance to block center
          const blockCenter = new Vector3(x + 0.5, y + 0.5, z + 0.5);
          const distanceToBlock = camera.position.distanceTo(blockCenter);

          if (distanceToBlock > this.maxReach) continue;

          // Define the 6 faces of the block with their normals and plane positions
          const faces = [
            { name: "top", normal: new Vector3(0, 1, 0), position: y + 1 },
            { name: "bottom", normal: new Vector3(0, -1, 0), position: y },
            { name: "right", normal: new Vector3(1, 0, 0), position: x + 1 },
            { name: "left", normal: new Vector3(-1, 0, 0), position: x },
            { name: "front", normal: new Vector3(0, 0, 1), position: z + 1 },
            { name: "back", normal: new Vector3(0, 0, -1), position: z }
          ];

          for (const face of faces) {
            // Check if ray is pointing towards the face (not away from it)
            const dotProduct = direction.dot(face.normal);
            if (dotProduct >= 0) continue; // Ray pointing away from face or parallel

            // Calculate intersection point with the face plane
            let t = 0;
            let intersectionPoint = new Vector3();

            if (face.name === "top" || face.name === "bottom") {
              // Horizontal plane (XZ)
              t = (face.position - camera.position.y) / direction.y;
              intersectionPoint.set(
                camera.position.x + direction.x * t,
                face.position,
                camera.position.z + direction.z * t
              );
              // Check if intersection is within face bounds
              if (
                intersectionPoint.x < x ||
                intersectionPoint.x > x + 1 ||
                intersectionPoint.z < z ||
                intersectionPoint.z > z + 1
              ) {
                continue;
              }
            } else if (face.name === "right" || face.name === "left") {
              // Vertical plane (YZ)
              t = (face.position - camera.position.x) / direction.x;
              intersectionPoint.set(
                face.position,
                camera.position.y + direction.y * t,
                camera.position.z + direction.z * t
              );
              // Check if intersection is within face bounds
              if (
                intersectionPoint.y < y ||
                intersectionPoint.y > y + 1 ||
                intersectionPoint.z < z ||
                intersectionPoint.z > z + 1
              ) {
                continue;
              }
            } else {
              // Vertical plane (XY)
              t = (face.position - camera.position.z) / direction.z;
              intersectionPoint.set(
                camera.position.x + direction.x * t,
                camera.position.y + direction.y * t,
                face.position
              );
              // Check if intersection is within face bounds
              if (
                intersectionPoint.x < x ||
                intersectionPoint.x > x + 1 ||
                intersectionPoint.y < y ||
                intersectionPoint.y > y + 1
              ) {
                continue;
              }
            }

            // Check if this intersection is valid and closer
            if (t > 0 && t < closestDistance) {
              closestDistance = t;
              closestBlock = { x, y, z, face: face.name };
            }
          }
        }
      }
    }

    this.highlightedBlock = closestBlock;
  }

  // Handle mouse click for block interaction
  onMouseClick(button: "left" | "right") {
    if (!this.world || !this.highlightedBlock) return;

    const { x, y, z, face } = this.highlightedBlock;

    if (button === "left") {
      // Remove block
      this.world.removeBlock(x, y, z);
    } else if (button === "right") {
      // Place block on the adjacent position based on face
      let placeX = x;
      let placeY = y;
      let placeZ = z;

      switch (face) {
        case "top":
          placeY += 1;
          break;
        case "bottom":
          placeY -= 1;
          break;
        case "front":
          placeZ += 1;
          break;
        case "back":
          placeZ -= 1;
          break;
        case "right":
          placeX += 1;
          break;
        case "left":
          placeX -= 1;
          break;
      }

      // Check if placement position is valid (not inside player)
      const camera = this.controls?.object;
      if (camera) {
        const playerX = Math.floor(camera.position.x);
        const playerY = Math.floor(camera.position.y);
        const playerZ = Math.floor(camera.position.z);

        // Don't place block if it overlaps with player position
        const overlapX = Math.abs(placeX - playerX) < 1;
        const overlapY = Math.abs(placeY - playerY) < 2; // Player is 2 blocks tall
        const overlapZ = Math.abs(placeZ - playerZ) < 1;

        if (overlapX && overlapY && overlapZ) {
          return; // Don't place block
        }
      }

      this.world.addBlock(placeX, placeY, placeZ, this.selectedBlockType);
    }
  }
}

// Default starting position for the player
export const defaultPosition = { x: -48, y: 32, z: -48 };

// Singleton instance for global access if needed, or just export class
export const playerController = new PlayerController();
