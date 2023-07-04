import { Vector2 } from "@galacean/engine";

export interface IBoxSelectionHelper {
  onSelectStart(vec2: Vector2): any;
  onSelecting(vec2: Vector2): any;
  onSelectEnd(vec2: Vector2): any;
}

export class BoxSelectionDomHelper implements IBoxSelectionHelper {
  element: HTMLDivElement;
  startPoint: Vector2;
  pointTopLeft: Vector2;
  pointBottomRight: Vector2;
  isDown: boolean;
  onPointerDown: any;
  onPointerMove: any;
  onPointerUp: any;
  container: HTMLElement;

  constructor(container: HTMLElement, cssStyle?: Partial<CSSStyleDeclaration>) {
    this.element = document.createElement('div');
    const style = this.element.style;
    style.pointerEvents = 'none';
    style.position = 'absolute';
    if (cssStyle) {
      this.setStyle(cssStyle);
    }
    this.container = container;
    this.startPoint = new Vector2();
    this.pointTopLeft = new Vector2();
    this.pointBottomRight = new Vector2();
  }

  setStyle(cssStyle?: Partial<CSSStyleDeclaration>) {
    const style = this.element.style;
    for (let key in cssStyle) {
      style[key] = cssStyle[key];
    }
  }

  onSelectStart(vec2: Vector2) {
    this.container.parentElement.appendChild(this.element);

    this.element.style.left = vec2.x + 'px';
    this.element.style.top = vec2.y + 'px';
    this.element.style.width = '0px';
    this.element.style.height = '0px';

    this.startPoint.x = vec2.x;
    this.startPoint.y = vec2.y;
  }

  onSelecting(vec2: Vector2) {
    this.pointBottomRight.x = Math.max(this.startPoint.x, vec2.x);
    this.pointBottomRight.y = Math.max(this.startPoint.y, vec2.y);
    this.pointTopLeft.x = Math.min(this.startPoint.x, vec2.x);
    this.pointTopLeft.y = Math.min(this.startPoint.y, vec2.y);

    this.element.style.left = this.pointTopLeft.x + 'px';
    this.element.style.top = this.pointTopLeft.y + 'px';
    this.element.style.width = (this.pointBottomRight.x - this.pointTopLeft.x) + 'px';
    this.element.style.height = (this.pointBottomRight.y - this.pointTopLeft.y) + 'px';
  }

  onSelectEnd() {
    this.element.parentElement?.removeChild(this.element);
  }
}
