import { PerspectiveCamera, Vector3 } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Physics } from "./physics";
import type { World } from "./world.svelte";

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
}

// Default starting position for the player
export const defaultPosition = { x: -48, y: 32, z: -48 };

// Singleton instance for global access if needed, or just export class
export const playerController = new PlayerController();
