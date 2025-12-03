<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { OrbitControls } from "@threlte/extras";
  import { onMount } from "svelte";

  import { World } from "../utils/world.svelte";
  import { createUI } from "../utils/ui";

  const world = new World();

  let ui: ReturnType<typeof createUI>;

  onMount(() => {
    // Initialize UI with current world state
    const initialParams = {
      width: world.width,
      height: world.height,
      terrain: { ...world.terrain }
    };

    ui = createUI(initialParams, (key, value) => {
      if (key === "width") {
        world.width = value;
        world.depth = value;
      }
      if (key === "height") world.height = value;

      if (key === "terrain.seed") world.terrain.seed = value;
      if (key === "terrain.scale") world.terrain.scale = value;
      if (key === "terrain.magnitude") world.terrain.magnitude = value;
      if (key === "terrain.offset") world.terrain.offset = value;
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
    target={[world.width / 2, world.height / 2, world.depth / 2]}
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

{#key world.matrices}
  <T.InstancedMesh
    args={[undefined, undefined, world.matrices.length]}
    castShadow
    oncreate={(ref) => {
      world.matrices.forEach((blockMatrix, index) => {
        ref.setMatrixAt(index, blockMatrix.matrix);
        ref.setColorAt(index, blockMatrix.color);
      });
      ref.instanceMatrix.needsUpdate = true;
      if (ref.instanceColor) ref.instanceColor.needsUpdate = true;
    }}
  >
    <T.BoxGeometry />
    <T.MeshLambertMaterial />
  </T.InstancedMesh>
{/key}
