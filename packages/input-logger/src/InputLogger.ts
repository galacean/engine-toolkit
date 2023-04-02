import {
  Camera,
  CameraClearFlags,
  Color,
  Engine,
  Entity,
  Layer,
  MathUtil,
  Scene,
  TextHorizontalAlignment,
  TextRenderer,
  TextVerticalAlignment,
  Vector2
} from "oasis-engine";
import { InputLoggerControl } from "./InputLoggerControl";

export class InputLogger {
  private _engine: Engine;
  private _logEntity: Entity;
  private _camera: Camera;
  private _textEntity: Entity;
  private _textRenderer: TextRenderer;
  private _logScript: InputLoggerControl;
  private _offset: Vector2 = new Vector2(0, 0);

  private _scale: number = 1;
  private _designHeight = 1624;
  private _designWidth = 750;
  private _layer: Layer = Layer.Layer30;
  private _realHeight: number;
  private _realWidth: number;

  /**
   * The scale of text.
   */
  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = value;
    this._textEntity.transform.setScale(50 * value, 50 * value, 50 * value);
  }

  /**
   * Whether to display keyboard information.
   */
  get showKeyBoard(): boolean {
    return this._logScript._showKeyboard;
  }

  set showKeyBoard(value: boolean) {
    this._logScript._showKeyboard = value;
  }

  /**
   * Whether to display pointer information.
   */
  get showPointer(): boolean {
    return this._logScript._showPointer;
  }

  set showPointer(value: boolean) {
    this._logScript._showPointer = value;
  }

  /**
   * Effective scene.
   */
  get scene(): Scene {
    return this._logEntity.scene;
  }

  set scene(value: Scene) {
    const { _logEntity: logEntity } = this;
    const preScene = logEntity.scene;
    if (preScene !== value) {
      preScene?.removeRootEntity(logEntity);
      value?.addRootEntity(logEntity);
    }
  }

  /**
   * Exclusive culling mask.
   */
  get layer(): Layer {
    return this._layer;
  }

  set layer(value: Layer) {
    if (this._layer !== value) {
      this._layer = value;
      this._logEntity.layer = this._textEntity.layer = this._camera.cullingMask = value;
    }
  }

  /**
   * The color of text.
   */
  get color(): Color {
    return this._textRenderer.color;
  }

  set color(value: Color) {
    this._textRenderer.color = value;
  }

  /**
   * Display position offset, specified in normalized.
   */
  get offset(): Vector2 {
    return this._offset;
  }

  set offset(value: Vector2) {
    this._offset.x = MathUtil.clamp(value.x, 0, 1);
    this._offset.y = MathUtil.clamp(value.y, 0, 1);
    this._textEntity.transform.setPosition(
      -this._realWidth / 2 + this._realWidth * value.x,
      this._realHeight / 2 - this._realHeight * value.y,
      -10
    );
  }

  /**
   * Show log.
   */
  show() {
    this._logEntity.isActive = true;
  }

  /**
   * Hide log.
   */
  hide() {
    this._logEntity.isActive = false;
  }

  constructor(engine: Engine) {
    this._engine = engine;
    const scene = engine.sceneManager.activeScene;
    const logEntity = (this._logEntity = scene.createRootEntity("InputLog"));
    const camera = (this._camera = logEntity.addComponent(Camera));
    camera.isOrthographic = true;
    camera.orthographicSize = engine.canvas.height / window.devicePixelRatio / 2;
    camera.enableFrustumCulling = false;
    camera.priority = 10000000;
    camera.clearFlags = CameraClearFlags.None;
    logEntity.layer = camera.cullingMask = this._layer;

    const textEntity = (this._textEntity = logEntity.createChild("InputText"));
    const renderer = (this._textRenderer = textEntity.addComponent(TextRenderer));
    textEntity.transform.setScale(50, 50, 50);
    renderer.castShadows = false;
    renderer.fontSize = 50;
    renderer.horizontalAlignment = TextHorizontalAlignment.Left;
    renderer.verticalAlignment = TextVerticalAlignment.Top;
    this._logScript = textEntity.addComponent(InputLoggerControl);

    this._setFitMode(FitMode.FitHeight);
  }

  private _setFitMode(value: FitMode) {
    const { _engine: engine } = this;
    if (value === FitMode.FitHeight) {
      this._realHeight = this._designHeight;
      this._realWidth = (this._designHeight / engine.canvas.height) * engine.canvas.width;
    } else {
      this._realWidth = this._designWidth;
      this._realHeight = (this._designWidth / engine.canvas.width) * engine.canvas.height;
    }
    this._camera.orthographicSize = this._realHeight / 2;
    this._textEntity.transform.setPosition(
      -this._realWidth / 2 + this._realWidth * this._offset.x,
      this._realHeight / 2 - this._realHeight * this._offset.y,
      -10
    );
  }
}

enum FitMode {
  FitHeight,
  FitWidth
}
