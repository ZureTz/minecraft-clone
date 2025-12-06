<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { ACESFilmicToneMapping } from "three";

  import Scene from "./components/Scene.svelte";
  import Crosshair from "./components/Crosshair.svelte";
  import Hotbar from "./components/Hotbar.svelte";
  import { World } from "./utils/world.svelte";
  import { defaultPosition } from "./utils/player.svelte";

  // Initialize world and player position state
  const world = new World();

  // Copy the default position to avoid mutating the imported object
  let position = $state(defaultPosition);
</script>

{#if world.isGenerating}
  <!-- Show Loading Spinner -->
  <div
    class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-b from-slate-950 via-emerald-950 to-slate-950 text-white"
  >
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
      ></div>
      <div
        class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 1s;"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-8">
      <!-- Spinning Cube Icon -->
      <div class="relative w-24 h-24">
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="w-20 h-20 rounded-lg border-2 border-emerald-400 border-t-cyan-300 border-r-cyan-300 animate-spin"
          ></div>
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="w-12 h-12 rounded-md bg-linear-to-br from-emerald-400 to-emerald-600 opacity-60"
          ></div>
        </div>
      </div>

      <!-- Loading Text -->
      <div class="text-center space-y-3">
        <h1
          class="text-3xl font-bold tracking-tight bg-linear-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
        >
          Generating World
        </h1>
        <p class="text-sm text-slate-300 font-medium tracking-widest">
          Procedural Generation In Progress...
        </p>
      </div>
    </div>
  </div>
{:else}
  <!-- Main Canvas -->
  <Canvas shadows toneMapping={ACESFilmicToneMapping}>
    <Scene {world} bind:position />
  </Canvas>

  <!-- Crosshair -->
  <Crosshair />

  <!-- Hotbar -->
  <Hotbar />

  <!-- Position Display -->
  <div
    class="pointer-events-none absolute bottom-4 left-4 z-50 flex flex-col gap-1 rounded-lg bg-black/60 p-3 font-mono text-sm text-white backdrop-blur-sm"
  >
    <div class="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Coordinates</div>
    <div class="flex gap-3">
      <span class="flex items-center gap-1"
        ><span class="font-bold text-red-400">X</span> {position.x}</span
      >
      <span class="flex items-center gap-1"
        ><span class="font-bold text-green-400">Y</span> {position.y}</span
      >
      <span class="flex items-center gap-1"
        ><span class="font-bold text-blue-400">Z</span> {position.z}</span
      >
    </div>
  </div>
{/if}
