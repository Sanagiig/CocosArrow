import { _decorator, Component, Node, Tween, tween, UIOpacity } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
const { ccclass, property } = _decorator;

@ccclass("LoadingUIController")
export class LoadingUIController extends UIController {
  private _tween: Tween<any> | null = null;

  protected onLoad(): void {
    super.onLoad();
  }
  
  display() {
    if (this._tween) {
      this._tween.stop();
    }
    super.display();
    this._tween = tween(this.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start();
  }

  hide() {
    if (this._tween) {
      this._tween.stop();
    }

    this._tween = tween(this.getComponent(UIOpacity))
      .to(
        0.5,
        { opacity: 0 },
        {
          onComplete: () => {
            super.hide();
          },
        },
      )
      .start();
  }
}
