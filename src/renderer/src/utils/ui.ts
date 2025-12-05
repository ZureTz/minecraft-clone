import Stats from "three/examples/jsm/libs/stats.module.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { resources } from "./blocks";
import { playerController } from "./player.svelte";

interface UIParams {
  width: number;
  height: number;
  terrain: {
    seed: number;
    scale: number;
    magnitude: number;
    offset: number;
  };
  resources: Record<
    number,
    {
      scale: { x: number; y: number; z: number };
      scarcity: number;
    }
  >;
}

export function createUI(initialParams: UIParams, onChange: (key: string, value: number) => void) {
  const stats = new Stats();
  stats.dom.classList.add("stats-ui");
  document.body.appendChild(stats.dom);

  const gui = new GUI();

  // Create a proxy object for GUI to manipulate
  const params = { ...initialParams };

  gui.title("设置");

  // World dimensions
  gui
    .add(params, "width", 2, 512, 1)
    .onFinishChange((v: number) => onChange("width", v))
    .name("宽度");
  gui
    .add(params, "height", 1, 64, 1)
    .onFinishChange((v: number) => onChange("height", v))
    .name("高度");

  // Player params
  const playerFolder = gui.addFolder("玩家");
  playerFolder.add(playerController, "moveSpeed", 1, 50, 1).name("移动速度");
  playerFolder.add(playerController, "damping", 1, 20, 0.1).name("阻尼");

  // Terrain params
  const terrainFolder = gui.addFolder("地形");
  terrainFolder
    .add(params.terrain, "seed", 1, 10000, 1)
    .onFinishChange((v: number) => onChange("terrain.seed", v))
    .name("种子");
  terrainFolder
    .add(params.terrain, "scale", 1, 100, 0.01)
    .onFinishChange((v: number) => onChange("terrain.scale", v))
    .name("缩放");
  terrainFolder
    .add(params.terrain, "magnitude", 0, 1, 0.01)
    .onFinishChange((v: number) => onChange("terrain.magnitude", v))
    .name("幅度");
  terrainFolder
    .add(params.terrain, "offset", 0, 1, 0.01)
    .onFinishChange((v: number) => onChange("terrain.offset", v))
    .name("偏移");

  // Resources params
  const resourcesFolder = gui.addFolder("资源");
  resourcesFolder.close();

  resources.forEach((resource) => {
    const resourceParams = params.resources[resource.id];
    if (!resourceParams) return;

    const folder = resourcesFolder.addFolder(resource.name);
    folder.close();

    folder
      .add(resourceParams, "scarcity", 0, 1, 0.01)
      .onFinishChange((v: number) => onChange(`resources.${resource.id}.scarcity`, v))
      .name("稀缺度");

    const scaleFolder = folder.addFolder("缩放");
    scaleFolder
      .add(resourceParams.scale, "x", 1, 100, 1)
      .onFinishChange((v: number) => onChange(`resources.${resource.id}.scale.x`, v))
      .name("X 缩放");
    scaleFolder
      .add(resourceParams.scale, "y", 1, 100, 1)
      .onFinishChange((v: number) => onChange(`resources.${resource.id}.scale.y`, v))
      .name("Y 缩放");
    scaleFolder
      .add(resourceParams.scale, "z", 1, 100, 1)
      .onFinishChange((v: number) => onChange(`resources.${resource.id}.scale.z`, v))
      .name("Z 缩放");
  });

  return {
    stats,
    destroy: () => {
      document.body.removeChild(stats.dom);
      gui.destroy();
    }
  };
}
