import Stats from "three/examples/jsm/libs/stats.module.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

interface UIParams {
  width: number;
  height: number;
}

export function createUI(
  initialParams: UIParams,
  onChange: (key: keyof UIParams, value: number) => void
) {
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const gui = new GUI();

  // Create a proxy object for GUI to manipulate
  const params = { ...initialParams };

  gui.add(params, "width", 2, 128, 1).onChange((v: number) => onChange("width", v));
  gui.add(params, "height", 1, 64, 1).onChange((v: number) => onChange("height", v));

  return {
    stats,
    destroy: () => {
      document.body.removeChild(stats.dom);
      gui.destroy();
    }
  };
}
