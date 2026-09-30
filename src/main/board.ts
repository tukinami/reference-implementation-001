import { Assets, Container, Sprite, Text } from "pixi.js";
import { InputManager } from "./../input";
import { Scene, SceneMessage } from "./scene_manager";
import { Block, Star, Character, Goal, BlockColor } from "./collision_object";
import { Hud, HudMessage } from "./hud";
import { TitleScene } from "./title";

export const BOARD_PIXEL = 480;
const BOARD_SECTION = 6;
const BOARD_POSITION_X = 240;
const BOARD_POSITION_Y = 30;
export const BLOCK_SIZE = BOARD_PIXEL / BOARD_SECTION;
export const BLOCK_FALL_SPEED = 2;
export const STAR_FALL_SPEED = 2;
export const BLOCK_CONNECTION = 3;
export const POWER_PER_BLOCK = 5;
const STAR_FALL_TIMING = 300;
const LEVEL_MIN = 1;
const LEVEL_MAX = 5;

const BLOCK_COLOR_LIST: BlockColor[] = [
  "red",
  "green",
  "blue",
  "yellow",
  "purple",
];

type BoardState = HudMessage;

export class MainGame extends Scene {
  #board: Board;
  #ui: MainUI;
  #hud: Hud;
  #level: number;
  #state: BoardState;

  constructor(parent: Container, input: InputManager) {
    super(parent, input);

    this.#level = LEVEL_MIN;
    this.#board = new Board(this.container, this.input, this.#level);
    this.#ui = new MainUI(this.container);
    this.#hud = new Hud(this.container, this.input);
    this.#state = "Normal";
  }

  nextState(boardState: BoardState) {
    if (this.#state !== boardState) {
      switch (boardState) {
        case "StageClear":
        case "GameClear": {
          this.#level++;

          if (this.#level > LEVEL_MAX) {
            this.#board.stateToGameClear();
          }
          break;
        }
      }
      this.#state = this.#board.getState();
    }
  }

  nextGame() {
    this.#board.destroy();
    this.#ui.destroy();
    this.#hud.destroy();

    this.#board = new Board(this.container, this.input, this.#level);
    this.#ui = new MainUI(this.container);
    this.#hud = new Hud(this.container, this.input);
  }

  render(): SceneMessage {
    this.nextState(this.#board.getState());
    const hudState = this.#hud.action(this.#board.getState());

    const underPower = this.#board.getUnderPower();
    const createPower = this.#board.getCreatePower();
    this.#ui.updateUnderPowerGage(underPower);
    this.#ui.updateCreatePowerGage(createPower);

    switch (hudState) {
      case "Normal": {
        this.#board.render();
        return { name: "normal" };
      }
      case "Pause": {
        return { name: "normal" };
      }
      case "Title": {
        return { name: "next", nextScene: TitleScene };
      }
      case "Retry": {
        return { name: "next", nextScene: MainGame };
      }
      case "NextStage": {
        this.nextGame();
        return { name: "normal" };
      }
    }
  }
}

class MainUI {
  container: Container;
  #background: Sprite;
  #underPowerGage: Text;
  #createPowerGage: Text;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);

    this.#background = new Sprite(Assets.get("background_ui"));
    this.container.addChild(this.#background);

    this.#underPowerGage = new Text({
      text: "0",
      anchor: 1.0,
      style: {
        fontSize: 20,
        fill: 0x999999,
      },
    });
    this.container.addChild(this.#underPowerGage);
    this.#underPowerGage.position.x = 900;
    this.#underPowerGage.position.y = 400;

    this.#createPowerGage = new Text({
      text: "0",
      anchor: 1.0,
      style: {
        fontSize: 20,
        fill: 0x000000,
      },
    });
    this.container.addChild(this.#createPowerGage);
    this.#createPowerGage.position.x = 900;
    this.#createPowerGage.position.y = 430;
  }

  updateUnderPowerGage(power: number) {
    this.#underPowerGage.text = `${power}`;
  }
  updateCreatePowerGage(power: number) {
    this.#createPowerGage.text = `${power}`;
  }

  destroy() {
    this.container.destroy();
  }
}

export class Board {
  #width: number;
  #height: number;
  container: Container;
  #goal: Goal;
  #blockBoard: BlockBoard;
  #starController: StarController;
  #character: Character;
  #input: InputManager;
  #state: BoardState;

  constructor(
    parent: Container,
    input: InputManager,
    level: number = LEVEL_MIN,
  ) {
    this.#width = BOARD_PIXEL;
    this.#height = BOARD_PIXEL;

    this.container = new Container();
    parent.addChild(this.container);
    this.container.position.set(BOARD_POSITION_X, BOARD_POSITION_Y);
    this.container.width = this.#width;
    this.container.height = this.#height;

    this.#blockBoard = new BlockBoard(this.container);
    this.#starController = new StarController(this.container, level);
    this.#input = input;
    this.#character = new Character(this.container);
    // TODO
    this.#goal = new Goal(this.container, {
      x: BOARD_PIXEL - BLOCK_SIZE,
      y: 0,
    });
    this.#state = "Normal";
  }

  render() {
    const goalIn = this.#goal.checkHit(this.#character);

    const eraseBlocks = this.#blockBoard.eraseBlockLine();
    this.#blockBoard.destroyDeadBlock();
    this.#character.action(this.#input, this.#blockBoard);
    this.#character.render();

    const isHit = this.#character.checkHit(
      this.#blockBoard.blocks,
      this.#starController.stars,
    );

    const newBlocks = this.#starController.render(this.#blockBoard);
    this.#blockBoard.blocks = this.#blockBoard.blocks.concat(newBlocks).flat();

    switch (this.#state) {
      case "GameOver": {
        this.#blockBoard.gameOverFallDown();
        this.#starController.gameOverFallDown();
        this.#character.gameOverFallDown();
        break;
      }
      case "StageClear":
      case "GameClear": {
        break;
      }
      default: {
        this.#character.increaceUnderPower(eraseBlocks);
        this.#blockBoard.render();
        this.#starController.generateStarIfNeed();
        break;
      }
    }

    if (goalIn) {
      this.#state = "StageClear";
    } else if (isHit) {
      this.#state = "GameOver";
    }
  }

  getState() {
    return this.#state;
  }

  stateToGameClear() {
    this.#state = "GameClear";
  }

  getUnderPower(): number {
    return this.#character.getUnderPower();
  }

  getCreatePower(): number {
    return this.#character.getCreatePower();
  }

  destroy() {
    this.container.destroy();
  }
}

export class BlockBoard {
  container: Container;
  blocks: Block[];

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);

    this.blocks = [];
  }

  render() {
    this.blocks.sort((a, b) => a.compareY(b));

    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      if (!block.getIsAlive()) {
        continue;
      }

      if (!block.getIsFall() && block.collision.y % BLOCK_SIZE !== 0) {
        const diff = block.collision.y % BLOCK_SIZE;
        block.collision.y -= diff;
      }

      const underBlock = this.blocks.find((element) => {
        if (block.collision.y >= element.collision.y || !element.getIsAlive()) {
          return false;
        }
        return block.isInRangeOfCollisionWidth(element);
      });

      if (underBlock) {
        if (block.hasSpaceBetweenTopAndBottom(underBlock)) {
          block.fallDown();
        } else {
          block.toEndOfFall();
        }
      } else if (!block.isGround()) {
        block.fallDown();
      } else {
        block.toEndOfFall();
      }

      block.render();
    }
  }

  gameOverFallDown() {
    for (const block of this.blocks) {
      block.gameOverFallDown();
      block.render();

      if (block.collision.top > BOARD_PIXEL) {
        block.toEndOfAlive();
      }
    }
  }

  eraseBlockLine(): number {
    const blocksCopy = Array.from(this.blocks);
    const blocks = blocksCopy.flatMap((value) => {
      if (value.getIsFall()) {
        return [];
      } else {
        return value;
      }
    });
    const checkList: (Block | undefined)[][] = [];
    for (let y = 0; y < BOARD_SECTION; y++) {
      checkList.push([]);
      for (let x = 0; x < BOARD_SECTION; x++) {
        checkList[y].push(undefined);
      }
    }

    for (const block of blocks) {
      const x = Math.floor(block.getX() / BLOCK_SIZE);
      const y = Math.floor(block.getY() / BLOCK_SIZE);
      if (x < 0 || y < 0 || x > BOARD_SECTION || y > BOARD_SECTION) {
        continue;
      }

      if (x < BOARD_SECTION && y < BOARD_SECTION) {
        checkList[y][x] = block;
      }
    }

    let eraseBlocks: number = 0;

    for (let y = 0; y < checkList.length; y++) {
      for (let x = 0; x < checkList[y].length; x++) {
        const target = checkList[y][x];
        if (target === undefined) {
          continue;
        }
        const targetColor = target?.getBlockType();
        if (targetColor === "unbreakable") {
          continue;
        }

        let verticalCount = 1;
        for (let vy = y + 1; vy < checkList.length; vy++) {
          if (
            checkList[vy][x] !== undefined &&
            checkList[vy][x]?.getIsAlive() &&
            checkList[vy][x]?.getBlockType() === targetColor
          ) {
            verticalCount++;
          } else {
            break;
          }
        }
        if (verticalCount >= BLOCK_CONNECTION) {
          for (let vy = y; vy < y + verticalCount; vy++) {
            if (checkList[vy][x] !== undefined) {
              checkList[vy][x]?.toEndOfAlive();
              eraseBlocks++;
            }
          }
        }

        let horizontalCount = 1;
        for (let vx = x + 1; vx < checkList[y].length; vx++) {
          if (
            checkList[y][vx] !== undefined &&
            checkList[y][vx]?.getIsAlive() &&
            checkList[y][vx]?.getBlockType() === targetColor
          ) {
            horizontalCount++;
          } else {
            break;
          }
        }
        if (horizontalCount >= BLOCK_CONNECTION) {
          for (let vx = x; vx < x + horizontalCount; vx++) {
            if (checkList[y][vx] !== undefined) {
              checkList[y][vx]?.toEndOfAlive();
              eraseBlocks++;
            }
          }
        }
      }
    }
    return eraseBlocks;
  }

  destroyDeadBlock() {
    const blocks = Array.from(this.blocks);

    for (const block of blocks) {
      if (!block.getIsAlive()) {
        block.destroy();
      }
    }

    this.blocks = blocks.flatMap((value) => {
      if (value.sprite.destroyed) {
        return [];
      } else {
        return value;
      }
    });
  }
}

export class StarController {
  container: Container;
  stars: Star[];
  #level: number;
  #count: number;
  constructor(parent: Container, level: number) {
    this.container = new Container();
    parent.addChild(this.container);
    this.stars = [];
    this.#level = level;
    this.#count = 0;
  }

  generateStarIfNeed() {
    if (this.#count % STAR_FALL_TIMING === 0) {
      this.generateStarBody();
    }
    this.#count++;
  }

  generateStarBody() {
    const colorList = BLOCK_COLOR_LIST.slice(0, this.#level);
    const color = colorList[Math.floor(Math.random() * colorList.length)];
    const x = BLOCK_SIZE * Math.floor(Math.random() * BOARD_SECTION);

    const newStar = new Star(this.container, color, x);
    this.stars.push(newStar);
  }

  render(blockboard: BlockBoard): Block[] {
    this.stars.sort((a, b) => a.compareY(b));
    const blocksCopy = Array.from(blockboard.blocks);
    blocksCopy.sort((a, b) => a.compareY(b));
    const newBlocks: Block[] = [];

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const underBlock = blocksCopy.find((element) => {
        if (star.collision.y >= element.collision.y || !element.getIsAlive()) {
          return false;
        }
        return star.isInRangeOfCollisionWidth(element);
      });

      let isFall = false;
      let isUnderBlockFall = false;
      if (underBlock) {
        if (star.hasSpaceBetweenTopAndBottom(underBlock)) {
          isFall = star.fallDown(underBlock);
          isUnderBlockFall = underBlock.getIsFall();
        }
      } else if (!star.isGround()) {
        isFall = star.fallDown(underBlock);
      }

      if (!isFall && !isUnderBlockFall) {
        const x = star.getX();
        let y = star.getY();

        const mod = y % BLOCK_SIZE;
        if (mod > BLOCK_SIZE / 2) {
          y += BLOCK_SIZE - mod;
        } else {
          y -= mod;
        }

        const newBlock = new Block(blockboard.container, star.getColorType(), {
          x,
          y,
        });
        newBlocks.push(newBlock);
        star.toEndOfAlive();
      }

      star.render();
    }

    this.stars = this.stars.flatMap((value) => {
      if (value.getIsAlive()) {
        return [value];
      } else {
        value.destroy();
        return [];
      }
    });

    return newBlocks;
  }

  gameOverFallDown() {
    for (const star of this.stars) {
      star.gameOverFallDown();
      star.render();

      if (star.collision.top > BOARD_PIXEL) {
        star.toEndOfAlive();
      }
    }
  }
}
