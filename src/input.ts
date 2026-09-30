import { gameErrorKind, GameError } from "./error";

/**
 * 使用するボタンのコード
 */
export const buttonCode = {
  left: "left",
  up: "up",
  right: "right",
  down: "down",
  pause: "pause",
  reset: "reset",
  quit: "quit",
  create: "create",
  rise: "rise",
  grab: "grab",
} as const;
export type ButtonCode = (typeof buttonCode)[keyof typeof buttonCode];

/**
 * 使用するキーボードのキーコード。
 */
export const keyboardCode = {
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowRight: "ArrowRight",
  ArrowDown: "ArrowDown",
  r: "r",
  q: "q",
  z: "z",
  Escape: "Escape",
  c: "c",
  x: "x",
} as const;
export type KeyboardCode = (typeof keyboardCode)[keyof typeof keyboardCode];

/**
 * 初期化時マージするコード類のリスト。
 */
const INIT_BUTTON_MERGE_LIST: [ButtonCode, KeyboardCode][] = [
  ["left", "ArrowLeft"],
  ["up", "ArrowUp"],
  ["right", "ArrowRight"],
  ["down", "ArrowDown"],
  ["pause", "Escape"],
  ["reset", "r"],
  ["quit", "q"],
  ["rise", "z"],
  ["create", "c"],
  ["grab", "x"],
];

/**
 * 入力を管理するクラス(Singleton)
 */
export class InputManager {
  private _map: Map<ButtonCode, number>;
  private _keyboard: KeyboardManager;
  private _mergeMap: Map<ButtonCode, KeyboardCode>;

  constructor() {
    this._map = new Map();
    this._keyboard = new KeyboardManager();
    this._mergeMap = new Map();

    INIT_BUTTON_MERGE_LIST.forEach(([bCode, kCode]) => {
      this._map.set(bCode, 0);
      this._keyboard.setKeyboardCode(kCode);
      this._mergeMap.set(bCode, kCode);
    });
  }

  update(): void {
    try {
      this._keyboard.update();
      this.merge();
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
    }
  }

  getCount(code: ButtonCode): number {
    const count = this._map.get(code);
    if (count === undefined) {
      throw new GameError(
        gameErrorKind.getCountFromInputManager,
        `ボタンコードがマップと照合できませんでした。 code: ${code}`,
      );
    } else {
      return count;
    }
  }

  /**
   * 保持している入力をマージする。
   */
  private merge(): void {
    this._map.forEach((_value, key) => {
      const targetKeyboardCode = this._mergeMap.get(key);
      if (targetKeyboardCode === undefined) {
        throw new GameError(
          gameErrorKind.mergeInput,
          `ボタンコードがマージマップと照合できませんでした。 key: ${key}`,
        );
      } else {
        const keyboardCount = this.getKeyboardCount(targetKeyboardCode);
        this._map.set(key, keyboardCount);
      }
    });
  }

  /**
   * 保持しているKeyboardManagerから押しているフレーム数を取得する。
   */
  private getKeyboardCount(code: KeyboardCode): number {
    const count = this._keyboard.getPressingCount(code);

    if (count === undefined) {
      throw new GameError(
        gameErrorKind.getCountFromKeyboardManager,
        `キーボードの入力が取得できませんでした。 keycode: ${code}`,
      );
      return 0;
    } else {
      return count;
    }
  }

  getKeyboardReleasingCount(code: KeyboardCode): number {
    const count = this._keyboard.getReleasingCount(code);

    if (count === undefined) {
      throw new GameError(
        gameErrorKind.getCountFromKeyboardManager,
        `キーボードの入力が取得できませんでした。 keycode: ${code}`,
      );
      return 0;
    } else {
      return count;
    }
  }
}

/**
 * キーボードの入力を保持するクラス。
 */
class KeyCounter {
  is_press: boolean;
  releasingCount: number;
  pressingCount: number;

  constructor() {
    this.is_press = false;
    this.releasingCount = 0;
    this.pressingCount = 0;
  }

  onKeyUp() {
    this.is_press = false;
  }
  onKeyDown() {
    this.is_press = true;
  }
}

/**
 * キーボード入力を管理するクラス。
 */
class KeyboardManager {
  private _map: Map<string, KeyCounter>;

  constructor() {
    this._map = new Map();

    window.addEventListener("keyup", (event: KeyboardEvent) => {
      this._map.get(event.key)?.onKeyUp();
    });
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      this._map.get(event.key)?.onKeyDown();
    });
  }

  /**
   * キーボードのキーコードを設定する。
   */
  setKeyboardCode(code: KeyboardCode): void {
    this._map.set(code, new KeyCounter());
  }

  /**
   * キーボードの入力フレームを更新する。
   */
  update(): void {
    this._map.forEach((value, key) => {
      const v = value;
      if (value.is_press) {
        if (value.releasingCount > 0) {
          v.releasingCount = 0;
        }
        v.pressingCount++;
      } else {
        if (value.pressingCount > 0) {
          v.pressingCount = 0;
        }
        v.releasingCount++;
      }
      this._map.set(key, v);
    });
  }

  /**
   * キーボードのキーが押されているフレーム数を返す。
   */
  getPressingCount(code: KeyboardCode): number | undefined {
    return this._map.get(code)?.pressingCount;
  }
  /**
   * キーボードのキーのが離されているフレーム数を返す。
   */
  getReleasingCount(code: KeyboardCode): number | undefined {
    return this._map.get(code)?.releasingCount;
  }
}
