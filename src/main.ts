import { Application, Assets } from "pixi.js";
import { assetsManifest as manifest } from "./assets";
import { SceneManager } from "./main/scene_manager";
import { TitleScene } from "./main/title";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  await Assets.init({ manifest });
  await Assets.loadBundle([
    "title",
    "ui_main",
    "main_static",
    "main_block",
    "character",
    "main_star",
  ]);

  const mainGame = new SceneManager(app.stage);
  mainGame.setScene(TitleScene);

  // Listen for animate update
  app.ticker.add(() => {
    mainGame.render();
  });
})();
