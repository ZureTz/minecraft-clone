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

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // Click to lock
    const onClick = (): void => {
      playerController.lock();
    };
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
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
    playerController.init(ref, renderer.domElement);
  }}
/>
