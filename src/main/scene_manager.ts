import { Container, Rectangle, Graphics } from "pixi.js";
import { InputManager } from "./../input";

export const WINDOW_WIDTH = 960;
export const WINDOW_HEIGHT = 540;

export type SceneMessage =
  | { name: "normal" }
  | {
      name: "next";
      nextScene: typeof Scene;
    };

export class SceneManager {
  parentContainer: Container;
  input: InputManager;
  currentScene: Scene;

  constructor(parent: Container) {
    this.parentContainer = parent;
    this.input = new InputManager();
    this.currentScene = new Scene(this.parentContainer, this.input);
  }

  setScene(scene: typeof Scene) {
    this.currentScene = new scene(this.parentContainer, this.input);
  }

  render() {
    this.input.update();
    const message = this.currentScene.render();
    switch (message.name) {
      case "normal": {
        break;
      }
      case "next": {
        this.currentScene.destroy();
        this.setScene(message.nextScene);
      }
    }
  }
}

export class Scene {
  container: Container;
  input: InputManager;
  mask: Graphics;
  constructor(parent: Container, input: InputManager) {
    this.container = new Container({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      boundsArea: new Rectangle(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT),
    });
    parent.addChild(this.container);
    this.input = input;

    this.mask = new Graphics();
    this.mask.rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    this.mask.fill();
    this.container.mask = this.mask;
  }

  render(): SceneMessage {
    return { name: "normal" };
  }

  destroy() {
    this.container.destroy();
  }
}
