import { Container, Sprite, Assets, Text } from "pixi.js";
import {
  Scene,
  SceneMessage,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from "./scene_manager";
import { InputManager } from "../input";
import { MainGame } from "./board";

export class TitleScene extends Scene {
  sprite: Sprite;
  text: Text;
  #count: number;
  #isTransition: boolean;

  constructor(parent: Container, input: InputManager) {
    super(parent, input);
    this.sprite = new Sprite(Assets.get("background_title"));
    this.container.addChild(this.sprite);
    this.#count = 0;
    this.#isTransition = false;

    this.text = new Text({
      text: "Press z to start",
      anchor: 0.5,
      style: {
        fontSize: 20,
        fill: 0x333333,
      },
    });
    this.text.position.x = WINDOW_WIDTH / 2;
    this.text.position.y = WINDOW_HEIGHT / 2;
    this.container.addChild(this.text);
  }

  render(): SceneMessage {
    if (this.#isTransition) {
      this.#count++;

      if (this.#count > 10) {
        return {
          name: "next",
          nextScene: MainGame,
        };
      }
    }

    if (this.input.getCount("rise") > 0) {
      const count: number = this.input.getCount("rise");
      if (count % 6 === 0) {
        this.#isTransition = true;
        return { name: "normal" };
      }
    }
    return { name: "normal" };
  }
}
