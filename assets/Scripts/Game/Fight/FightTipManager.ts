import { Camera, Canvas, Label, Node, Prefab, UIOpacity, UITransform, Vec3, find, tween, v3 } from "cc";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { Constant } from "../Base/Constant";
import { GameApp } from "../GameApp";

export default class FightTipManager {
  static _instance: FightTipManager;
  private _fightDamageTipPrefab: Prefab;

  static get instance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new FightTipManager();
    return this._instance;
  }

  constructor() {
    if (FightTipManager._instance) {
      throw new Error("FightTipManager exist");
    }

    this._fightDamageTipPrefab = ResManager.Instance.getAsset("Prefab", "ui/common/fightTip") as Prefab;
    console.log("FightTipManager", this);
  }

  private _trans2UIPos(target: Node) {
    const screenPos = GameApp.Instance.gameCamera
      .getComponent(Camera)
      .worldToScreen(target.getWorldPosition());
    const uiWpos = GameApp.Instance.uiCameraNode.getComponent(Camera).screenToWorld(screenPos);
    const finalPos = GameApp.Instance.uiCanvasNode.getComponent(UITransform).convertToNodeSpaceAR(uiWpos);
    return finalPos;
  }

  displayDamageTip(target: Node, offset: Vec3, type: number, num: number) {
    const uiCanvas = GameApp.Instance.uiCameraNode.parent;
    const tipNode = PoolManager.instance.getNode(this._fightDamageTipPrefab, uiCanvas);
    const reduceNode = tipNode.getChildByName("reduceBlood");
    const addBloodNode = tipNode.getChildByName("addBlood");
    const criticalNode = tipNode.getChildByName("criticalHit");
    const pos = this._trans2UIPos(target);
    let opacityComp;
    let labelStr = num === 0 ? "Miss" : num.toString();

    reduceNode.active = false;
    addBloodNode.active = false;
    criticalNode.active = false;

    // 恢复初始数据
    tipNode.setPosition(pos.add(offset));
    tipNode.scale = v3(0.3, 0.3, 0.3);
    opacityComp = tipNode.getComponent(UIOpacity) || tipNode.addComponent(UIOpacity);
    opacityComp.opacity = 255;

    switch (type) {
      case Constant.FIGHT_TIP.ADD_BLOOD:
        addBloodNode.active = true;
        addBloodNode.getChildByName("num").getComponent(Label).string = `+${labelStr}`;
        break;
      case Constant.FIGHT_TIP.REDUCE_BLOOD:
        reduceNode.active = true;
        reduceNode.getChildByName("num").getComponent(Label).string = `${labelStr}`;
        break;
      case Constant.FIGHT_TIP.CRITICAL_HIT:
        criticalNode.active = true;
        criticalNode.getChildByName("num").getComponent(Label).string = `${labelStr}`;
        break;
      default:
        console.error("错误的 fightTip 类型", type);
        return;
    }

    tween(tipNode)
      .by(0.5, { position: v3(0, 40, 0), scale: v3(1, 1, 1) })
      .start();

    tween(tipNode.getComponent(UIOpacity))
      .to(0.5, { opacity: 0 })
      .call(() => {
        PoolManager.instance.putNode(tipNode);
      })
      .start();
  }
}
