<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { OrbitControls } from "@threlte/extras";
  import { onMount } from "svelte";

  import { World } from "../utils/world";
  import { createUI } from "../utils/ui";

  let worldWidth = $state(32);
  let worldHeight = $state(16);
  let world = $derived(new World(worldWidth, worldHeight, worldWidth));
  let matrices = $derived(world.generateWorld());

  let ui: ReturnType<typeof createUI>;

  onMount(() => {
    ui = createUI({ width: worldWidth, height: worldHeight }, (key, value) => {
      if (key === "width") worldWidth = value;
      if (key === "height") worldHeight = value;
    });

    return () => {
      ui.destroy();
    };
  });

  useTask(() => {
    ui?.stats.update();
  });
</script>

<T.PerspectiveCamera makeDefault position={[-32, 16, -32]} fov={75}>
  <OrbitControls target={[worldWidth / 2, worldHeight / 2, worldWidth / 2]} enableDamping />
</T.PerspectiveCamera>

<T.Color attach="background" args={["#87CEEB"]} />

<T.DirectionalLight position={[1, 1, 1]} castShadow />
<T.DirectionalLight position={[-1, 1, -0.5]} castShadow />
<T.AmbientLight intensity={0.1} castShadow />

<T.InstancedMesh
  args={[undefined, undefined, matrices.length]}
  castShadow
  oncreate={(ref) => {
    matrices.forEach((blockMatrix, i) => {
      ref.setMatrixAt(i, blockMatrix.matrix);
    });
    ref.instanceMatrix.needsUpdate = true;
  }}
>
  <T.BoxGeometry />
  <T.MeshLambertMaterial color="#00b000" />
</T.InstancedMesh>
