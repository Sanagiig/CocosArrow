import { _decorator, Component, Node, tween, Tween, v3, Vec3 } from "cc";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
const { ccclass, property } = _decorator;

@ccclass("WarningStrip")
export class WarningStrip extends Component {
  private _tween: Tween<any> = null!;
  private _scale: number;
  protected onLoad(): void {}

  setup(startPos: Vec3, endPos: Vec3, scale: number) {
    const forward = v3();
    Vec3.subtract(forward, startPos, endPos).normalize();
    startPos.subtract(forward.clone().multiplyScalar(1.5));
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);
    this.node.forward = forward;
    this.node.setScale(1, 1, 0);
    this._scale = scale;
    this.display();
  }

  private _stopTween() {
    if (this._tween) {
      this._tween.stop();
    }
  }

  display() {
    this._stopTween();
    this._tween = tween(this.node)
      .to(0.2, { scale: v3(1, 1, this._scale) })
      .start();
  }

  hide() {
    this._tween = tween(this.node)
    .delay(0.5)
    .call(() => {
      this.recycle();
    })
    .start();
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }
}
