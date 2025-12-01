<script lang="ts">
  import { T } from "@threlte/core";
  import { OrbitControls, interactivity } from "@threlte/extras";
  import { Spring } from "svelte/motion";

  interactivity();
  const scale = new Spring(1);
</script>

<T.PerspectiveCamera
  makeDefault
  position={[10, 10, 10]}
  fov={75}
  oncreate={(ref) => {
    ref.lookAt(0, 1, 0);
  }}
>
  <OrbitControls enableDamping />
</T.PerspectiveCamera>

<T.DirectionalLight position={[10, 10, 15]} castShadow />

<T.Mesh
  position={[0, 1, 0]}
  onpointerenter={() => scale.set(1.5)}
  onpointerleave={() => scale.set(1)}
  scale={scale.current}
  castShadow
>
  <T.BoxGeometry args={[1, 2, 1]} />
  <T.MeshStandardMaterial color="hotpink" />
</T.Mesh>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.CircleGeometry args={[4, 40]} />
  <T.MeshStandardMaterial color="white" />
</T.Mesh>
