<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";

  import Scene from "./components/Scene.svelte";
</script>

<Canvas shadows={PCFSoftShadowMap} toneMapping={ACESFilmicToneMapping}>
  <Scene />
</Canvas>
