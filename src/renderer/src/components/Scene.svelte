<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { OrbitControls } from "@threlte/extras";
  import { onMount } from "svelte";

  import { World, type WorldParams } from "../utils/world";
  import { createUI } from "../utils/ui";

  const defaultWidth = 64;
  const defaultHeight = 16;
  let worldParams = $state<WorldParams>({
    width: defaultWidth,
    height: defaultHeight,
    depth: defaultWidth,
    terrain: {
      seed: Math.floor(Math.random() * 100000),
      scale: 48,
      magnitude: 0.5,
      offset: 0.5
    }
  });
  let world = $derived(new World(worldParams));
  let matrices = $derived(world.generateWorld());

  let ui: ReturnType<typeof createUI>;

  onMount(() => {
    ui = createUI(worldParams, (key, value) => {
      if (key === "width") worldParams.width = worldParams.depth = value;
      if (key === "height") worldParams.height = value;

      if (key === "terrain.seed") worldParams.terrain.seed = value;
      if (key === "terrain.scale") worldParams.terrain.scale = value;
      if (key === "terrain.magnitude") worldParams.terrain.magnitude = value;
      if (key === "terrain.offset") worldParams.terrain.offset = value;
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
  <OrbitControls
    target={[worldParams.width / 2, worldParams.height / 2, worldParams.depth / 2]}
    enableDamping
    dampingFactor={0.05}
    minDistance={10}
    maxDistance={200}
  />
</T.PerspectiveCamera>

<T.Color attach="background" args={["#87CEEB"]} />

<T.DirectionalLight position={[1, 1, 1]} castShadow />
<T.DirectionalLight position={[-1, 1, -0.5]} castShadow />
<T.AmbientLight intensity={0.1} />

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
