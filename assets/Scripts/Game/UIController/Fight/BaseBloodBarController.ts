import { _decorator, Component, Node, v3, Vec3, instantiate, Camera, tween, Tween } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { Constant } from "../../Base/Constant";
import { GameApp } from "../../GameApp";

const { ccclass, property } = _decorator;

@ccclass("BaseBloodBarController")
export class BaseBloodBarController extends UIController {
  protected _uiCanvas: Node;
  protected _targetNode: Node;
  protected _offsetPos = v3();
  protected _targetWpos = v3();
  protected _curPos = v3();
  protected _hp: number;
  protected _totalHP: number;
  protected _bloodTween: Tween<any> = null!;

  get hp() {
    return this._hp;
  }

  get totalHP() {
    return this._totalHP;
  }

  protected onLoad(): void {
    super.onLoad();
    this._uiCanvas = this.node.parent;
    console.log("BaseBloodBarController", this);
  }

  // 装载血条
  setup(target: Node, offset: Vec3, totalHP: number, curHP: number) {
    this._targetNode = target;
    this._offsetPos.set(offset);
    this._totalHP = totalHP;
    this._hp = curHP;
    this._refreshBloodBar();
  }

  refreshHP(num: number) {
    this._hp += num;
    if (this._hp <= 0) {
      this._hp = 0;
      this._targetNode.emit(Constant.EVENT_TYPE.HP_EMPTY);
    } else if (this._hp > this._totalHP) {
      this._hp = this._totalHP;
      this._targetNode.emit(Constant.EVENT_TYPE.HP_FULL);
    }
    this._refreshBloodBar();
  }

  protected _refreshBloodBar() {
    const whiteBarNode = this.getViewNode("/whiteBar");
    const curBloodBarNode = this.getViewNode("/curBloodBar");
    const ratio = this._hp / this._totalHP;

    if (this._bloodTween) {
      this._bloodTween.stop();
    }

    curBloodBarNode.scale = v3(ratio, 1, 1);
    this._bloodTween = tween(whiteBarNode)
      .to(0.5, { scale: v3(ratio, 1, 1) })
      .start();
  }

  protected lateUpdate(dt: number): void {
    if (this._targetNode && this._uiCanvas) {
      this._targetWpos.set(this._targetNode.worldPosition);
      GameApp.Instance.gameCamera
        .getComponent(Camera)
        .convertToUINode(this._targetWpos, this._uiCanvas, this._curPos);
      this.node.setPosition(this._curPos.add(this._offsetPos));
    }
  }
}
