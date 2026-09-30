/**
 * ゲーム中に起こるエラーの種類
 */
export const gameErrorKind = {
  mergeInput: "MergeInput",
  getCountFromInputManager: "getCountFromInputManager",
  getCountFromKeyboardManager: "getCountFromKeyboardManager",
} as const;
export type GameErrorKind = (typeof gameErrorKind)[keyof typeof gameErrorKind];

/**
 * ゲーム中に起こるエラーを表すクラス。
 */
export class GameError extends Error {
  gameErrorKind: GameErrorKind;

  constructor(kind: GameErrorKind, message?: string) {
    super(message);

    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, GameError);
    // }

    this.name = "GameError";
    this.gameErrorKind = kind;
  }
}

export function representError(error: Error): void {
  const errorTitle =
    error instanceof GameError
      ? `${error.name}: ${error.gameErrorKind}`
      : `${error.name}`;
  const errorStack = error.stack ? error.stack : "";
  const errorText = `${errorTitle}: ${error.message}\n${errorStack}`;

  console.log(errorText);
  alert(errorText);
}
