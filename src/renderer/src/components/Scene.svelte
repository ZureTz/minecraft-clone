<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { OrbitControls } from "@threlte/extras";
  import { onMount } from "svelte";

  import { getBlockColor, getTexture, loadBlockTextures } from "../utils/textures";
  import { createUI } from "../utils/ui";
  import { World } from "../utils/world.svelte";

  const world = new World();

  const textures = loadBlockTextures();

  let ui: ReturnType<typeof createUI>;
  onMount(() => {
    // Initialize UI with current world state
    ui = createUI(world.getUIParams(), (key: string, value: number) => {
      world.updateParam(key, value);
    });
    return () => ui.destroy();
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
<T.AmbientLight intensity={0.5} />

{#await textures then txts}
  {#key world.matrices}
    <!-- Top -->
    {#each Object.entries(world.matrices.top) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.rotateX(-Math.PI / 2);
            geo.translate(0, 0.5, 0);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "top", txts)}
          color={getBlockColor(Number(id), "top")}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Bottom -->
    {#each Object.entries(world.matrices.bottom) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.rotateX(Math.PI / 2);
            geo.translate(0, -0.5, 0);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "bottom", txts)}
          color={getBlockColor(Number(id), "bottom")}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Front -->
    {#each Object.entries(world.matrices.front) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.translate(0, 0, 0.5);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "front", txts)}
          color={getBlockColor(Number(id), "front")}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Back -->
    {#each Object.entries(world.matrices.back) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.rotateY(Math.PI);
            geo.translate(0, 0, -0.5);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "back", txts)}
          color={getBlockColor(Number(id), "back")}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Left -->
    {#each Object.entries(world.matrices.left) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.rotateY(-Math.PI / 2);
            geo.translate(-0.5, 0, 0);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "left", txts)}
          color={getBlockColor(Number(id), "left")}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Right -->
    {#each Object.entries(world.matrices.right) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        oncreate={(ref) => {
          matrices.forEach((matrix, index) => {
            ref.setMatrixAt(index, matrix);
          });
          ref.instanceMatrix.needsUpdate = true;
        }}
      >
        <T.PlaneGeometry
          args={[1, 1]}
          oncreate={(geo) => {
            geo.rotateY(Math.PI / 2);
            geo.translate(0.5, 0, 0);
          }}
        />
        <T.MeshLambertMaterial
          map={getTexture(Number(id), "right", txts)}
          color={getBlockColor(Number(id), "right")}
        />
      </T.InstancedMesh>
    {/each}
  {/key}
{/await}
