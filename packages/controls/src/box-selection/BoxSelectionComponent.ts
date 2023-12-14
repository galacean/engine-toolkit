import { Component } from "@galacean/engine";

export class BoxSelectionComponent extends Component {
  private _isSelected = false;

  get isSelect() {
    return this._isSelected;
  }

  set isSelect(v: boolean) {
    if (this._isSelected !== v) {
      this._isSelected = v;
      if (v) {
        this.onSelect();
      } else {
        this.onUnselect();
      }
    }
  }

  onSelect = () => {};
  onUnselect = () => {};
}
