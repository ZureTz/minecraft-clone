<script lang="ts">
  import { onMount } from "svelte";
  import { T, useTask } from "@threlte/core";
  import type { WebGLRenderer } from "three";

  import { defaultPosition, playerController } from "../utils/player.svelte";
  import type { World } from "../utils/world.svelte";

  // Props
  interface Props {
    renderer: WebGLRenderer;
    world: World;
    position?: { x: number; y: number; z: number };
  }

  // Initialize props
  let { renderer, world, position = $bindable(defaultPosition) }: Props = $props();

  const onKeyDown = (event: KeyboardEvent): void => playerController.onKeyDown(event);
  const onKeyUp = (event: KeyboardEvent): void => playerController.onKeyUp(event);

  const onMouseDown = (event: MouseEvent): void => {
    // Left click (button 0) or Right click (button 2)
    if (event.button === 0) {
      playerController.onMouseClick("left");
    } else if (event.button === 2) {
      playerController.onMouseClick("right");
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // Add mouse event listeners
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    // Prevent context menu on right click
    renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    // Click to lock
    const onClick = (): void => {
      playerController.lock();
    };
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("click", onClick);
      playerController.dispose();
    };
  });

  useTask((delta) => {
    playerController.update(delta);
    const pos = playerController.getPosition();
    position.x = pos.x;
    position.y = pos.y;
    position.z = pos.z;
  });
</script>

<T.PerspectiveCamera
  makeDefault
  position={[defaultPosition.x, defaultPosition.y, defaultPosition.z]}
  fov={playerController.fov}
  oncreate={(ref) => {
    ref.lookAt(world.width / 2, world.height / 2, world.depth / 2);
    playerController.init(ref, renderer.domElement, world);
  }}
/>
