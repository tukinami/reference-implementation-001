import { Assets, Rectangle, Sprite, Container } from "pixi.js";
import { InputManager } from "./../input";
import {
  BOARD_PIXEL,
  BLOCK_SIZE,
  BLOCK_FALL_SPEED,
  STAR_FALL_SPEED,
  POWER_PER_BLOCK,
  BlockBoard,
} from "./board";

export type BlockColor = "red" | "green" | "blue" | "yellow" | "purple";
export type BlockTypeAll = BlockColor | "unbreakable";

export class CollisionObject {
  collision: Rectangle;

  constructor(x: number, y: number, width: number, height: number) {
    this.collision = new Rectangle(x, y, width, height);
  }

  getX() {
    return this.collision.x;
  }
  getY() {
    return this.collision.y;
  }

  isGround(): boolean {
    return this.collision.y >= BOARD_PIXEL - this.collision.height;
  }

  compareY(target: CollisionObject): number {
    return this.collision.y - target.collision.y;
  }

  hasSpaceBetweenTopAndBottom(target: CollisionObject): boolean {
    return target.collision.top > this.collision.bottom;
  }

  // this function return true if target block is in range of this collision.
  isInRangeOfCollisionWidth(target: CollisionObject): boolean {
    if (
      this.collision.left < target.collision.right &&
      target.collision.right <= this.collision.right
    ) {
      return true;
    } else if (
      target.collision.left < this.collision.right &&
      this.collision.left <= target.collision.left
    ) {
      return true;
    } else {
      return false;
    }
  }

  isInRangeOfCollisionHeight(target: CollisionObject): boolean {
    if (
      this.collision.top < target.collision.bottom &&
      target.collision.bottom <= this.collision.bottom
    ) {
      return true;
    } else if (
      target.collision.top < this.collision.bottom &&
      this.collision.top <= target.collision.top
    ) {
      return true;
    } else {
      return false;
    }
  }
}

export class Goal extends CollisionObject {
  sprite: Sprite;

  constructor(container: Container, position: { x: number; y: number }) {
    super(position.x, position.y, BLOCK_SIZE, BLOCK_SIZE);

    this.sprite = new Sprite(Assets.get("goal"));
    this.sprite.position.set(this.collision.x, this.collision.y);
    container.addChild(this.sprite);
  }

  checkHit(character: Character): boolean {
    return (
      this.isInRangeOfCollisionHeight(character) &&
      this.isInRangeOfCollisionWidth(character)
    );
  }
}

export class Block extends CollisionObject {
  #blockType: BlockTypeAll;
  sprite: Sprite;
  #isFall: boolean;
  #isAlive: boolean;
  #animationCount: number;

  constructor(
    container: Container,
    type: BlockTypeAll,
    position: { x: number; y: number },
  ) {
    super(position.x, position.y, BLOCK_SIZE, BLOCK_SIZE);

    this.#blockType = type;
    this.sprite = new Sprite(Assets.get(`block_${type}`));
    this.sprite.position.set(this.collision.x, this.collision.y);
    this.sprite.origin.set(this.collision.width / 2, this.collision.height / 2);
    container.addChild(this.sprite);

    this.#isFall = false;
    this.#isAlive = true;
    this.#animationCount = 15;
  }

  fallDown() {
    this.#isFall = true;
    this.collision.y += BLOCK_FALL_SPEED;

    if (this.isGround()) {
      this.collision.y = BOARD_PIXEL - this.collision.height;
      this.toEndOfFall();
    }
  }

  gameOverFallDown() {
    this.collision.y += BLOCK_FALL_SPEED;
  }

  render() {
    this.sprite.position.set(this.collision.x, this.collision.y);
  }

  toEndOfFall() {
    this.#isFall = false;
  }

  getIsFall(): boolean {
    return this.#isFall;
  }

  getBlockType(): BlockTypeAll {
    return this.#blockType;
  }

  toEndOfAlive() {
    this.#isAlive = false;
  }

  getIsAlive() {
    return this.#isAlive;
  }

  destroy() {
    const scale = this.#animationCount / 15;
    this.sprite.scale.set(scale);
    this.#animationCount--;

    if (this.#animationCount <= 0) {
      this.sprite.destroy();
    }
  }
}

export class Star extends CollisionObject {
  #colorType: BlockColor;
  sprite: Sprite;
  #isAlive: boolean;

  constructor(container: Container, type: BlockColor, x: number) {
    super(x, -BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    this.#colorType = type;
    this.sprite = new Sprite(Assets.get(`star_${type}`));
    container.addChild(this.sprite);
    this.sprite.origin.set(this.collision.width / 2, this.collision.height / 2);
    this.sprite.position.set(this.collision.x, this.collision.y);

    this.#isAlive = true;
  }

  getColorType(): BlockColor {
    return this.#colorType;
  }

  getIsAlive() {
    return this.#isAlive;
  }

  toEndOfAlive() {
    this.#isAlive = false;
  }

  fallDown(target?: CollisionObject): boolean {
    this.collision.y += STAR_FALL_SPEED;

    const isTangent = target && !this.hasSpaceBetweenTopAndBottom(target);
    if (this.isGround() || isTangent) {
      if (this.isGround()) {
        this.collision.y = BOARD_PIXEL - this.collision.height;
      }
      return false;
    } else {
      return true;
    }
  }

  gameOverFallDown() {
    this.collision.y += STAR_FALL_SPEED;
  }

  render() {
    this.sprite.position.set(this.collision.x, this.collision.y);
    this.sprite.rotation += 0.05;
  }

  destroy() {
    this.sprite.destroy();
  }
}

export type CharacterState =
  | { name: "normal" }
  | { name: "rise"; nextPosition: { x: number; y: number }; count: number }
  | { name: "grab"; targetBlock: Block; targetDirection: CharacterDirection }
  | { name: "damage"; count: number };
type CharacterDirection = "left" | "right";

export class Character extends CollisionObject {
  sprite: Sprite;
  #state: CharacterState;
  #direction: CharacterDirection;
  #isFall: boolean;
  #underPower: number;
  #createPower: number;

  constructor(container: Container) {
    super(0, BOARD_PIXEL - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    this.sprite = new Sprite(Assets.get(`character_idle_01`));
    container.addChild(this.sprite);
    this.sprite.position.set(this.collision.x, this.collision.y);
    this.sprite.origin.set(this.collision.width / 2, this.collision.height / 2);

    this.#isFall = false;
    this.#state = { name: "normal" };
    this.#direction = "right";
    this.#underPower = 0;
    this.#createPower = 0;
  }

  render() {
    this.sprite.position.set(this.collision.x, this.collision.y);
  }

  action(input: InputManager, blockBoard: BlockBoard) {
    if (this.#state.name === "damage") {
      this.damaged();
      return;
    }

    if (this.#state.name === "rise") {
      this.rise();
      return;
    }

    const blocks = Array.from(blockBoard.blocks);
    const horizontalBlocks = blocks.flatMap((value) => {
      if (this.isInRangeOfCollisionHeight(value)) {
        return value;
      } else {
        return [];
      }
    });

    if (input.getCount("create")) {
      const count = input.getCount("create");
      if (count > 8 && count % 9 === 0) {
        this.create(blockBoard, horizontalBlocks);
        this.fall(blocks);
        return;
      }
    }

    if (input.getCount("rise")) {
      const count = input.getCount("rise");
      if (count % 5 === 0) {
        this.changeStateRiseIfNeeded(blocks);
      }
    }

    if (input.getCount("grab")) {
      const count = input.getCount("grab");
      if (count > 2 && this.#state.name !== "grab") {
        this.changeStateGrabIfNeeded(horizontalBlocks);
      }
    } else if (this.#state.name === "grab") {
      this.#state = { name: "normal" };
    }

    if (input.getCount("right") > 0) {
      this.changeDirection("right");
      const count = input.getCount("right");
      if (count % 6 === 0) {
        if (this.#state.name === "grab") {
          this.grab(horizontalBlocks);
        } else {
          this.moveHorizontal(horizontalBlocks, this.nextX());
        }
      }
    } else if (input.getCount("left") > 0) {
      this.changeDirection("left");
      const count = input.getCount("left");
      if (count % 6 === 0) {
        if (this.#state.name === "grab") {
          this.grab(horizontalBlocks);
        } else {
          this.moveHorizontal(horizontalBlocks, this.nextX());
        }
      }
    }

    this.fall(blocks);
  }

  rise() {
    if (this.#state.name === "rise") {
      this.#state.count++;

      switch (this.#state.count) {
        case 8: {
          this.collision.x = this.#state.nextPosition.x;
          this.collision.y = this.#state.nextPosition.y;
          this.#state = { name: "normal" };
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  grab(horizontalBlocks: Block[]) {
    if (this.#state.name === "grab") {
      let nextBlockX = this.#state.targetBlock.collision.x;
      if (this.#direction === "left") {
        nextBlockX -= BLOCK_SIZE;
      } else {
        nextBlockX += BLOCK_SIZE;
      }

      const nextCharacterX = this.nextXRaw();

      if (
        !this.canMoveHorizontal(horizontalBlocks, nextCharacterX) &&
        nextCharacterX !== this.#state.targetBlock.collision.x
      ) {
        return;
      }

      if (
        !this.canMoveHorizontal(horizontalBlocks, nextBlockX) &&
        nextBlockX !== this.collision.x
      ) {
        return;
      }

      this.#state.targetBlock.collision.x = nextBlockX;
      this.#state.targetBlock.sprite.position.x = nextBlockX;

      this.collision.x = nextCharacterX;
    }
  }

  create(blockBoard: BlockBoard, horizontalBlocks: Block[]) {
    if (this.#createPower <= 0) {
      return;
    }

    let nextBlockX = this.collision.x;
    if (this.#direction === "left") {
      nextBlockX -= BLOCK_SIZE;
    } else {
      nextBlockX += BLOCK_SIZE;
    }

    if (!this.canMoveHorizontal(horizontalBlocks, nextBlockX)) {
      return;
    }
    const newBlock = new Block(blockBoard.container, "unbreakable", {
      x: nextBlockX,
      y: this.collision.y,
    });
    blockBoard.blocks.push(newBlock);
    this.#createPower--;
  }

  damaged() {
    if (this.#state.name === "damage") {
      if (this.#state.count === 0) {
        this.sprite.texture = Assets.get("character_damage_01");
        this.#direction = "left";
      }

      if (this.#state.count % 40 === 0) {
        this.changeDirection("right");
      } else if (this.#state.count % 20 === 0) {
        this.changeDirection("left");
      }

      this.#state.count++;
    }
  }

  changeStateRiseIfNeeded(blocks: Block[]) {
    const y = this.collision.y - this.collision.height;
    if (y < 0 || y > BOARD_PIXEL - BLOCK_SIZE) {
      return;
    }
    const x = this.nextXRaw();
    if (x < 0 || x > BOARD_PIXEL - BLOCK_SIZE) {
      return;
    }

    if (blocks.some((value) => value.collision.contains(x, y))) {
      return;
    }
    if (!blocks.some((value) => value.collision.contains(x, y + BLOCK_SIZE))) {
      return;
    }
    this.#state = { name: "rise", nextPosition: { x, y }, count: 0 };
  }

  changeStateGrabIfNeeded(horizontalBlocks: Block[]) {
    const x = this.nextX();
    const targetBlock = horizontalBlocks.find((value) =>
      value.collision.contains(x, this.collision.y),
    );

    if (targetBlock) {
      this.#state = {
        name: "grab",
        targetBlock,
        targetDirection: this.#direction,
      };
    }
  }

  fall(blocks: Block[]) {
    blocks.sort((a, b) => a.compareY(b));
    const underBlock = blocks.find((element) => {
      if (this.collision.y >= element.collision.y || !element.getIsAlive()) {
        return false;
      }
      return this.isInRangeOfCollisionWidth(element);
    });

    let toFall = false;
    if (underBlock) {
      if (underBlock.getIsFall()) {
        this.#isFall = true;
      } else if (this.hasSpaceBetweenTopAndBottom(underBlock)) {
        toFall = true;
      }
    } else if (!this.isGround()) {
      toFall = true;
    }

    if (this.#isFall) {
      this.fallDown();
    } else if (toFall) {
      this.collision.y += this.collision.height;
      this.#state = { name: "normal" };
    }
  }

  fallDown() {
    this.collision.y += BLOCK_FALL_SPEED;
    this.sprite.position.y = this.collision.y;

    if (this.isGround() || this.collision.y % BLOCK_SIZE === 0) {
      this.#isFall = false;
    }
  }

  gameOverFallDown() {
    if (!(this.collision.top > BOARD_PIXEL)) {
      this.collision.y += BLOCK_FALL_SPEED;
      this.render();
    }
  }

  changeDirection(nextDirection: CharacterDirection) {
    if (this.#direction === nextDirection) {
      return;
    }

    this.#direction = nextDirection;
    this.sprite.scale.x *= -1;
  }

  nextX(): number {
    let x = this.nextXRaw();
    if (x > BOARD_PIXEL - BLOCK_SIZE) {
      x = BOARD_PIXEL - BLOCK_SIZE;
    }
    if (x < 0) {
      x = 0;
    }
    return x;
  }

  nextXRaw(): number {
    if (this.#direction === "right") {
      return this.collision.x + BLOCK_SIZE;
    } else {
      return this.collision.x - BLOCK_SIZE;
    }
  }

  moveHorizontal(horizontalBlocks: Block[], x: number) {
    if (this.canMoveHorizontal(horizontalBlocks, x)) {
      this.collision.x = x;
    }
  }

  canMoveHorizontal(horizontalBlocks: Block[], x: number): boolean {
    if (x > BOARD_PIXEL - BLOCK_SIZE || x < 0) {
      return false;
    }

    const isEmpty = horizontalBlocks.length === 0;
    const contains = !horizontalBlocks.some((value) => {
      const targetCollision = new CollisionObject(
        x,
        this.collision.y,
        this.collision.width,
        this.collision.height,
      );
      const inner = value.isInRangeOfCollisionWidth(targetCollision);
      const isTarget = value.getIsAlive();
      return inner && isTarget;
    });
    return isEmpty || contains;
  }

  checkHit(blocks: Block[], stars: Star[]): boolean {
    if (this.#state.name === "damage") {
      return false;
    }
    const hitStar = stars.find((value) => {
      return (
        value.getIsAlive() &&
        this.isInRangeOfCollisionHeight(value) &&
        this.isInRangeOfCollisionWidth(value)
      );
    });

    if (hitStar) {
      hitStar.toEndOfAlive();
      this.#state = { name: "damage", count: 0 };
      return true;
    }

    const hitBlock = blocks.find((value) => {
      return (
        value.getIsAlive() &&
        this.isInRangeOfCollisionHeight(value) &&
        this.isInRangeOfCollisionWidth(value)
      );
    });

    if (hitBlock) {
      hitBlock.toEndOfAlive();
      this.#state = { name: "damage", count: 0 };
      return true;
    }

    return false;
  }

  getUnderPower() {
    return this.#underPower;
  }

  getCreatePower() {
    return this.#createPower;
  }

  increaceUnderPower(addition: number) {
    this.#underPower += addition;
    if (this.#underPower >= POWER_PER_BLOCK) {
      this.#createPower++;
      this.#underPower -= POWER_PER_BLOCK;
    }
  }
}
