import { PerspectiveCamera, Vector3 } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class PlayerController {
  // Movement state
  moveForward = $state(false);
  moveBackward = $state(false);
  moveLeft = $state(false);
  moveRight = $state(false);
  moveUp = $state(false);
  moveDown = $state(false);

    // Physics parameters
  moveSpeed = $state(10); // Units per second
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

  constructor() {}

  init(camera: PerspectiveCamera, domElement: HTMLElement) {
    this.controls = new PointerLockControls(camera, domElement);
  }

  dispose() {
    this.controls?.dispose();
  }

  lock() {
    this.controls?.lock();
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
    if (!this.controls?.isLocked) return;

    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize();

    // Apply damping
    this.velocity.x -= this.velocity.x * this.damping * delta;
    this.velocity.z -= this.velocity.z * this.damping * delta;
    this.velocity.y -= this.velocity.y * this.damping * delta;

    // Smooth FOV transition
    const targetFov = this.isSprinting
      ? this.defaultFov + this.sprintFovAddFactor
      : this.defaultFov;
    this.fov += (targetFov - this.fov) * 10 * delta;

    // Calculate acceleration
    // Only apply sprint acceleration if moving forward
    const currentAcceleration =
      this.isSprinting && this.moveForward
        ? this.defaultAcceleration * 2
        : this.defaultAcceleration;

    // Apply acceleration
    if (this.moveForward || this.moveBackward)
      this.velocity.z += this.direction.z * currentAcceleration * delta;
    if (this.moveLeft || this.moveRight)
      this.velocity.x += this.direction.x * this.defaultAcceleration * delta;
    if (this.moveUp || this.moveDown)
      this.velocity.y += this.direction.y * this.defaultAcceleration * delta;

    // Apply movement
    this.controls.moveRight(this.velocity.x * delta);
    this.controls.moveForward(this.velocity.z * delta);
    this.controls.object.position.y += this.velocity.y * delta;
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
