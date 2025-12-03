import Stats from "three/examples/jsm/libs/stats.module.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

interface UIParams {
  width: number;
  height: number;
  terrain: {
    seed: number;
    scale: number;
    magnitude: number;
    offset: number;
  };
}

export function createUI(initialParams: UIParams, onChange: (key: string, value: number) => void) {
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const gui = new GUI();

  // Create a proxy object for GUI to manipulate
  const params = { ...initialParams };

  gui.title("设置");
  // World dimensions
  gui
    .add(params, "width", 2, 128, 1)
    .onChange((v: number) => onChange("width", v))
    .name("宽度");
  gui
    .add(params, "height", 1, 64, 1)
    .onChange((v: number) => onChange("height", v))
    .name("高度");
  // Terrain params
  const terrainFolder = gui.addFolder("地形");
  terrainFolder
    .add(params.terrain, "seed")
    .onChange((v: number) => onChange("terrain.seed", v))
    .name("种子");
  terrainFolder
    .add(params.terrain, "scale", 1, 100, 0.01)
    .onChange((v: number) => onChange("terrain.scale", v))
    .name("缩放");
  terrainFolder
    .add(params.terrain, "magnitude", 0, 1, 0.01)
    .onChange((v: number) => onChange("terrain.magnitude", v))
    .name("幅度");
  terrainFolder
    .add(params.terrain, "offset", 0, 1, 0.01)
    .onChange((v: number) => onChange("terrain.offset", v))
    .name("偏移");
  return {
    stats,
    destroy: () => {
      document.body.removeChild(stats.dom);
      gui.destroy();
    }
  };
}
