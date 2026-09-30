import { Container, Graphics, Text } from "pixi.js";
import { InputManager } from "../input";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "./scene_manager";

export type HudState = "Normal" | "Pause" | "Title" | "Retry" | "NextStage";
export type HudMessage = "Normal" | "GameOver" | "StageClear" | "GameClear";

export class Hud {
  container: Container;
  #input: InputManager;
  #hudScene: HudScene | null;

  constructor(parent: Container, input: InputManager) {
    this.container = new Container();
    parent.addChild(this.container);

    this.#input = input;
    this.#hudScene = null;
  }

  action(message: HudMessage): HudState {
    if (this.#hudScene !== null) {
      const sceneMessage = this.#hudScene.action();
      return this.actionSceneMessage(sceneMessage);
    }

    if (this.#input.getCount("pause")) {
      const count = this.#input.getCount("pause");
      if (count % 6 === 0) {
        this.#hudScene = new HudPause(this.container, this.#input);
        return "Pause";
      }
    }

    switch (message) {
      case "Normal": {
        break;
      }
      case "GameOver": {
        this.#hudScene = new HudGameOver(this.container, this.#input);
        break;
      }
      case "StageClear": {
        this.#hudScene = new HudStageClear(this.container, this.#input);
        break;
      }
      case "GameClear": {
        this.#hudScene = new HudGameClear(this.container, this.#input);
        break;
      }
    }
    return "Normal";
  }

  actionSceneMessage(message: HudSceneActionMessage): HudState {
    switch (message) {
      case "Close": {
        this.hudSceneReset();
        return "Normal";
        break;
      }
      case "Pause": {
        return "Pause";
        break;
      }
      case "Title": {
        this.hudSceneReset();
        return "Title";
        break;
      }
      case "Retry": {
        this.hudSceneReset();
        return "Retry";
      }
      case "NextStage": {
        this.hudSceneReset();
        return "NextStage";
      }
      default: {
        return "Normal";
      }
    }
  }

  hudSceneReset() {
    this.#hudScene?.destroy();
    this.#hudScene = null;
  }

  destroy() {
    this.container.destroy();
  }
}

type HudSceneActionMessage =
  "Normal" | "Close" | "Pause" | "Title" | "Retry" | "NextStage";

class HudScene {
  container: Container;
  modal: Graphics;
  #count: number;
  input: InputManager;

  constructor(parent: Container, input: InputManager) {
    this.container = new Container();
    parent.addChild(this.container);

    this.modal = new Graphics();
    this.modal.rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    this.modal.fill({ color: 0x000000 });
    this.modal.alpha = 0.6;
    this.container.addChild(this.modal);

    this.#count = 0;
    this.input = input;
  }

  countUp() {
    this.#count++;
  }
  getCount() {
    return this.#count;
  }

  action(): HudSceneActionMessage {
    return "Close";
  }

  render(): boolean {
    return false;
  }

  destroy() {
    this.container.destroy();
  }
}

class HudPause extends HudScene {
  #isPressing: boolean;
  text: Text;

  constructor(parent: Container, input: InputManager) {
    super(parent, input);
    this.#isPressing = true;

    this.text = new Text({
      text: "Pause",
      anchor: 0.5,
      style: {
        fontSize: 20,
        fill: 0xffffff,
        align: "center",
      },
    });
    this.text.position.x = WINDOW_WIDTH / 2;
    this.text.position.y = WINDOW_HEIGHT / 2;
    this.container.addChild(this.text);
  }

  action(): HudSceneActionMessage {
    if (
      this.#isPressing &&
      this.input.getKeyboardReleasingCount("Escape") === 0
    ) {
      return "Pause";
    } else {
      this.#isPressing = false;
    }

    if (this.input.getCount("pause")) {
      const count = this.input.getCount("pause");
      if (count % 6 === 0) {
        return "Close";
      }
    }
    if (this.input.getCount("reset")) {
      const count = this.input.getCount("reset");
      if (count % 6 === 0) {
        return "Retry";
      }
    }

    if (this.input.getCount("quit")) {
      const count = this.input.getCount("quit");
      if (count % 6 === 0) {
        return "Title";
      }
    }
    return "Pause";
  }
}

class HudGameOver extends HudScene {
  text: Text;
  constructor(parent: Container, input: InputManager) {
    super(parent, input);
    this.text = new Text({
      text: "GameOver",
      anchor: 0.5,
      style: {
        fontSize: 20,
        fill: 0xffffff,
      },
    });
    this.text.position.x = WINDOW_WIDTH / 2;
    this.text.position.y = WINDOW_HEIGHT / 2;
    this.container.addChild(this.text);
  }

  action(): HudSceneActionMessage {
    this.countUp();
    this.modal.alpha = this.getCount() > 60 ? 0.6 : this.getCount() / 100;

    if (this.input.getCount("reset")) {
      const count = this.input.getCount("reset");
      if (count % 6 === 0) {
        return "Retry";
      }
    }

    if (this.input.getCount("quit")) {
      const count = this.input.getCount("quit");
      if (count % 6 === 0) {
        return "Title";
      }
    }
    return "Normal";
  }
}

class HudStageClear extends HudScene {
  text: Text;

  constructor(parent: Container, input: InputManager) {
    super(parent, input);
    this.text = new Text({
      text: "StageClear",
      anchor: 0.5,
      style: {
        fontSize: 20,
        fill: 0xffffff,
      },
    });
    this.text.position.x = WINDOW_WIDTH / 2;
    this.text.position.y = WINDOW_HEIGHT / 2;
    this.container.addChild(this.text);
  }

  action(): HudSceneActionMessage {
    this.countUp();
    this.modal.alpha = this.getCount() > 60 ? 0.6 : this.getCount() / 100;

    if (this.input.getCount("rise")) {
      const count = this.input.getCount("rise");
      if (count % 6 === 0) {
        return "NextStage";
      }
    }

    return "Normal";
  }
}

class HudGameClear extends HudScene {
  text: Text;

  constructor(parent: Container, input: InputManager) {
    super(parent, input);
    this.text = new Text({
      text: "GameClear",
      anchor: 0.5,
      style: {
        fontSize: 20,
        fill: 0xffffff,
      },
    });
    this.text.position.x = WINDOW_WIDTH / 2;
    this.text.position.y = WINDOW_HEIGHT / 2;
    this.container.addChild(this.text);
  }

  action(): HudSceneActionMessage {
    this.countUp();
    this.modal.alpha = this.getCount() > 60 ? 0.6 : this.getCount() / 100;

    if (this.input.getCount("reset")) {
      const count = this.input.getCount("reset");
      if (count % 6 === 0) {
        return "Retry";
      }
    }

    if (this.input.getCount("quit")) {
      const count = this.input.getCount("quit");
      if (count % 6 === 0) {
        return "Title";
      }
    }
    return "Normal";
  }
}
