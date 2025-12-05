<script lang="ts">
  import { onMount } from "svelte";
  import { T, useTask, useThrelte } from "@threlte/core";
  import { Object3D } from "three";

  import { getBlockColor, getNormalMap, getTexture, loadBlockTextures } from "../utils/textures";
  import { createUI } from "../utils/ui";
  import { World } from "../utils/world.svelte";
  import Player from "./Player.svelte";

  const { renderer } = useThrelte();
  // Shader-style renderer settings - bright sunny day
  renderer.toneMappingExposure = 1.6;

  // Initialize world
  interface Props {
    world: World;
    position?: { x: number; y: number; z: number };
  }

  let { world, position = $bindable() }: Props = $props();

  // Lil UI interface for adjusting world generation parameters
  let ui: ReturnType<typeof createUI>;
  onMount(() => {
    // Initialize UI with current world state
    ui = createUI(world.getUIParams(), (key: string, value: number) => {
      world.updateParam(key, value);
    });
    return () => {
      ui.destroy();
    };
  });

  useTask(() => {
    ui?.stats.update();
  });

  let lightTarget = $state(new Object3D());
</script>

<!-- Player with camera and fly controls -->
<Player {renderer} {world} bind:position />

<!-- Shader-style sky - bright sunny blue -->
<T.Color attach="background" args={["#70C0E0"]} />

<!-- Atmospheric fog for depth - lighter for sunny day -->
<T.Fog attach="fog" args={["#A0D0E0", 60, 180]} />

<!-- ============ SHADER-STYLE LIGHTING SETUP ============ -->

<!-- Light Target following player -->
{#if position}
  <T.Object3D position={[position.x, position.y, position.z]} bind:ref={lightTarget} />
{/if}

<!-- Main Sun - Bright dominant sunlight (high contrast shader look) -->
{#if position}
  <T.DirectionalLight
    target={lightTarget}
    position={[position.x + 80, position.y + 120, position.z + 50]}
    intensity={4}
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
{/if}

<!-- Sky light - Soft blue fill from opposite direction -->
<T.DirectionalLight position={[-60, 80, -40]} intensity={0.5} color="#87CEEB" />

<!-- Back fill light - Prevent completely black shadows -->
<T.DirectionalLight position={[-40, 30, -50]} intensity={0.2} color="#B8D4E8" />

<!-- Hemisphere light - Natural sky/ground gradient -->
<T.HemisphereLight args={["#70A0D0", "#403020", 0.7]} />

<!-- Ambient light - Subtle base fill -->
<T.AmbientLight intensity={0.2} color="#E8F0FF" />

{#await loadBlockTextures() then textures}
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
          map={getTexture(Number(id), "top", textures)}
          normalMap={getNormalMap(Number(id), "top", textures)}
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
          map={getTexture(Number(id), "bottom", textures)}
          normalMap={getNormalMap(Number(id), "bottom", textures)}
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
          map={getTexture(Number(id), "front", textures)}
          normalMap={getNormalMap(Number(id), "front", textures)}
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
          map={getTexture(Number(id), "back", textures)}
          normalMap={getNormalMap(Number(id), "back", textures)}
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
          map={getTexture(Number(id), "left", textures)}
          normalMap={getNormalMap(Number(id), "left", textures)}
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
          map={getTexture(Number(id), "right", textures)}
          normalMap={getNormalMap(Number(id), "right", textures)}
          normalScale={[0.8, 0.8]}
          color={getBlockColor(Number(id), "right")}
          roughness={0.75}
          metalness={0}
        />
      </T.InstancedMesh>
    {/each}
  {/key}
{/await}
