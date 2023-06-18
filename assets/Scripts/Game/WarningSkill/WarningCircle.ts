import { GameApp } from "../GameApp";
import { _decorator, Component, Node, tween, Vec3, Color, MeshRenderer, Material, v3 } from "cc";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
const { ccclass, property } = _decorator;

@ccclass("WarningCircle")
export class WarningCircle extends Component {
  private _tween: any = null!;
  private _scale: number = 0;
  private _startPos: Vec3 = v3();
  private _endPos: Vec3 = v3();

  setup(startPos: Vec3, endPos: Vec3, scale: number) {
    startPos.y = 2;
    endPos.y = 2;
    this._scale = scale;
    this._startPos.set(startPos);
    this._endPos.set(endPos);

    this.node.setScale(scale * 0.5, scale * 0.5, scale * 0.5);
    this.node.setWorldPosition(startPos);
    // this.node.setWorldPosition(endPos);
    this.display();
  }

  display() {
    this._stopTween();
    this._tween = tween(this.node)
      .to(0.1, { worldPosition: this._endPos })
      .to(0.2, { scale: Vec3.ONE.clone().multiplyScalar(this._scale) }, { easing: "smooth" })
      .start();
  }

  hide() {
    this._stopTween();

    this._tween = tween(this.node)
      .delay(0.5)
      .to(0.2, { scale: Vec3.ONE.clone().multiplyScalar(this._scale * 0.4) }, { easing: "backInOut" })
      .call(() => {
        this.recycle();
      })
      .start();
  }

  private _stopTween() {
    if (this._tween) {
      this._tween.stop();
    }
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }
}
