import { _decorator, Component, Node, Tween, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";

const { ccclass, property } = _decorator;

@ccclass("WarningLine")
export class WarningLine extends Component {
  private _tween: Tween<any> = null!;
  private _scale: number;
  protected onLoad(): void {}

  /**
   * 线攻击提示
   * @description 由于线警告是原点向 +Z 方向的物体，需要将其转为 start 为起始的线。
   * 所以要将 节点置于 start 坐标，forword 方向为 （start - end）。
   * 加上 forword * 偏移量（防止穿模）
   * @param startPos
   * @param endPos
   * @param scale
   */
  public setup(startPos: Vec3, endPos: Vec3, scale: number) {
    const forward = v3();
    Vec3.subtract(forward, startPos, endPos).normalize();
    startPos.subtract(forward.clone().multiplyScalar(1.5));
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);
    this.node.forward = forward;
    this.node.setScale(0, 1, 0);
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
      .to(0.2, { scale: v3(0, 1, this._scale) })
      .call(() => {
        this.recycle();
      })
      .start();
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }
}
