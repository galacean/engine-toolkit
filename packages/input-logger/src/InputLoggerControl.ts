import { Canvas, InputManager, Keys, PointerButton, Script, TextRenderer } from "@galacean/engine";

export class InputLoggerControl extends Script {
  // @internal
  _showKeyboard: boolean = true;
  // @internal
  _showPointer: boolean = true;
  private _inputManager: InputManager;
  private _textRenderer: TextRenderer;
  private _canvas: Canvas;
  private _stateMap = ["按下", "移动", "固定", "抬起", "离开"];

  onStart() {
    this._canvas = this.engine.canvas;
    this._textRenderer = this.entity.getComponent(TextRenderer);
    this._inputManager = this.engine.inputManager;
  }

  onUpdate(deltaTime: number): void {
    let log = "";
    this._showKeyboard && (log += this._getKeyboardLog());
    this._showPointer && (log += this._getPointerLog());
    this._textRenderer.text = log;
  }

  private _getKeyboardLog(): string {
    // @ts-ignore
    const { _keyboardManager: keyboardManager } = this._inputManager;
    const heldDownList = keyboardManager._curFrameHeldDownList;
    let info = ` *** 当前键盘信息(${
      // @ts-ignore
      keyboardManager._hadListener ? "focus" : "blur"
    }) ***\n按下按键:`;
    const length = heldDownList.length;
    if (length > 0) {
      for (let i = 0; i < length; i++) {
        info += "|" + Keys[heldDownList.get(i)] + "|";
      }
    } else {
      info += "无";
    }
    info += "\n";
    return info;
  }

  private _getPointerLog(): string {
    const { _inputManager: inputManager, _canvas: canvas } = this;
    const { pointers } = inputManager;
    let info = ` *** 当前触控信息(${
      // @ts-ignore
      inputManager._pointerManager._hadListener ? "focus" : "blur"
    }) ***\n`;
    info += `触控个数:${pointers.length || "无"}\n`;
    for (let i = 0; i < pointers.length; i++) {
      const pointer = pointers[i];
      // id
      info += "---------------------------------------\n";
      info += `id:${pointer.id} \n`;
      info += `状态:${this._stateMap[pointer.phase]} \n`;
      info += `坐标:${Math.round(pointer.position.x)}, ${Math.round(pointer.position.y)} \n`;
      info += `归一化:${Math.round((pointer.position.x / canvas.width) * 100) / 100}, ${
        Math.round((pointer.position.y / canvas.height) * 100) / 100
      } \n`;
      let buttonInfo: string = "";
      const { pressedButtons: buttons } = pointer;
      if (buttons !== 0) {
        for (let i = 0; i < 11; i++) {
          const pointerButton = Math.pow(2, i);
          if (buttons & pointerButton) {
            buttonInfo += "|" + PointerButton[pointerButton] + "|";
          }
        }
      } else {
        buttonInfo += "none";
      }
      info += `按键情况:${buttonInfo} \n`;
      info += `移动差值:${Math.round(pointer.deltaPosition.x * 100) / 100}, ${
        Math.round(pointer.deltaPosition.y * 100) / 100
      } \n`;
    }
    return info;
  }
}
