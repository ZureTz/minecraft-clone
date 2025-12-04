<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core";
  import { onMount } from "svelte";
  import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";

  import { getBlockColor, getNormalMap, getTexture, loadBlockTextures } from "../utils/textures";
  import { createUI } from "../utils/ui";
  import { World } from "../utils/world.svelte";

  const world = new World();

  const textures = loadBlockTextures();

  const { renderer } = useThrelte();

  // Shader-style renderer settings - bright sunny day
  renderer.toneMappingExposure = 1.6;

  let flyControls: FlyControls | null = null;

  let ui: ReturnType<typeof createUI>;
  onMount(() => {
    // Initialize UI with current world state
    ui = createUI(world.getUIParams(), (key: string, value: number) => {
      world.updateParam(key, value);
    });
    return () => {
      ui.destroy();
      flyControls?.dispose();
    };
  });

  useTask((delta) => {
    ui?.stats.update();
    flyControls?.update(delta);
  });
</script>

<T.PerspectiveCamera
  makeDefault
  position={[-48, 32, -48]}
  fov={70}
  oncreate={(ref) => {
    ref.lookAt(world.width / 2, world.height / 2, world.depth / 2);
    flyControls = new FlyControls(ref, renderer.domElement);
    flyControls.movementSpeed = 30;
    flyControls.rollSpeed = Math.PI / 8;
    flyControls.dragToLook = true;
  }}
/>

<!-- Shader-style sky - bright sunny blue -->
<T.Color attach="background" args={["#70C0E0"]} />

<!-- Atmospheric fog for depth - lighter for sunny day -->
<T.Fog attach="fog" args={["#A0D0E0", 60, 180]} />

<!-- ============ SHADER-STYLE LIGHTING SETUP ============ -->

<!-- Main Sun - Bright dominant sunlight (high contrast shader look) -->
<T.DirectionalLight
  position={[80, 120, 50]}
  intensity={5.5}
  color="#FFF8E7"
  castShadow
  oncreate={(ref) => {
    // Extended shadow coverage for larger world
    ref.shadow.camera.left = -120;
    ref.shadow.camera.right = 120;
    ref.shadow.camera.top = 120;
    ref.shadow.camera.bottom = -120;
    ref.shadow.camera.near = 0.5;
    ref.shadow.camera.far = 400;

    // High quality shadow map
    ref.shadow.mapSize.width = 2048;
    ref.shadow.mapSize.height = 2048;

    // Optimized shadow bias
    // Reduced normalBias to prevent light leaking at block seams
    // Adjusted bias to prevent shadow acne
    ref.shadow.bias = -0.0001;
    ref.shadow.normalBias = 0.0002;

    ref.shadow.camera.updateProjectionMatrix();
  }}
/>

<!-- Sky light - Soft blue fill from opposite direction -->
<T.DirectionalLight position={[-60, 80, -40]} intensity={0.5} color="#87CEEB" />

<!-- Back fill light - Prevent completely black shadows -->
<T.DirectionalLight position={[-40, 30, -50]} intensity={0.2} color="#B8D4E8" />

<!-- Hemisphere light - Natural sky/ground gradient -->
<T.HemisphereLight args={["#70A0D0", "#403020", 0.7]} />

<!-- Ambient light - Subtle base fill -->
<T.AmbientLight intensity={0.2} color="#E8F0FF" />

{#await textures then txts}
  {#key world.matrices}
    <!-- Top -->
    {#each Object.entries(world.matrices.top) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "top", txts)}
          normalMap={getNormalMap(Number(id), "top", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "top")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Bottom -->
    {#each Object.entries(world.matrices.bottom) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "bottom", txts)}
          normalMap={getNormalMap(Number(id), "bottom", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "bottom")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Front -->
    {#each Object.entries(world.matrices.front) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "front", txts)}
          normalMap={getNormalMap(Number(id), "front", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "front")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Back -->
    {#each Object.entries(world.matrices.back) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "back", txts)}
          normalMap={getNormalMap(Number(id), "back", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "back")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Left -->
    {#each Object.entries(world.matrices.left) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "left", txts)}
          normalMap={getNormalMap(Number(id), "left", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "left")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}

    <!-- Right -->
    {#each Object.entries(world.matrices.right) as [id, matrices] (id)}
      <T.InstancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow
        receiveShadow
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
        <T.MeshStandardMaterial
          map={getTexture(Number(id), "right", txts)}
          normalMap={getNormalMap(Number(id), "right", txts)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "right")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}
  {/key}
{/await}
