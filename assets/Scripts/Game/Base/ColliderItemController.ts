import { _decorator, Collider, Component, ICollisionEvent, ITriggerEvent, Node } from "cc";
import { Constant } from "./Constant";
import { Boss } from "../Enemy/Boss/Boss";
import { Monster } from "../Enemy/Monster/Monster";
import { Arrow } from "../Weapon/Arrow";
import { Player } from "../Player/Player";
import { DataCenter } from "../DataCenter/DataCenter";
import { EventManager } from "../../Framework/Managers/EventManager/EventManager";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { UIManager } from "../../Framework/Managers/UIManager/UIManager";
const { ccclass, property } = _decorator;

export const enum ColliderItemType {
  ARROW = 1, //弓箭
  HEART_BIG = 2, //大爱心, 玩家吃到后增加生命上限
  WARP_GATE = 3, //传送门
  NPC_BUSINESS_MAN = 4, //NPC商人
  NPC_WISE_MAN = 5, //NPC智慧老头
  HEART_SMALL = 6, //小爱心, 敌人掉落的爱心
}

@ccclass("ColliderItemController")
export class ColliderItemController extends Component {
  private _colliderComp: Collider;
  colliderType: ColliderItemType = ColliderItemType.ARROW;

  protected onLoad(): void {
    this._colliderComp = this.getComponent(Collider);
    console.log("colliderItem", this);
  }

  setType(type: ColliderItemType) {
    this.colliderType = type;
  }

  private _getMonsterCtrComp(other: Collider) {
    let comp: Monster | Boss = other.getComponent(Boss) || other.getComponent(Monster);
    if (!comp) {
      throw new Error("monster collider item 's controller not exist.");
    }
    return comp;
  }

  private _hitMonster(self: Collider, other: Collider) {
    const monster = this._getMonsterCtrComp(other);
    if (!Player.Instance.hasArrowPenetrate) {
      this.node.active = false;
    }
    monster.hurted();
  }

  private _arrowCollider(self: Collider, other: Collider) {
    switch (other.getGroup()) {
      case Constant.PHY_GROUP.OBSTACLE:
        this.node.active = false;
        break;
      case Constant.PHY_GROUP.MONSTER:
        this._hitMonster(self, other);
        break;
    }
  }

  private _heartSmallCollider(self: Collider, other: Collider) {
    switch (other.getGroup()) {
      case Constant.PHY_GROUP.PLAYER:
        break;
    }
  }

  private _heartBigCollider(self: Collider, other: Collider) {
    if (other.getGroup() === Constant.PHY_GROUP.PLAYER) {
      Player.Instance.refreshBlood(100, true);
      this.recycle();
    }
  }

  private _gateCollider(self: Collider, other: Collider) {
    const playerData = DataCenter.Instance.getPlayerData();
    playerData.level++;
    playerData.highestLevel = Math.max(playerData.level, playerData.highestLevel);
    EventManager.Instance.emit(Constant.EVENT_TYPE.ON_GAME_INIT);
  }

  private _npcBusinessCollider(self: Collider, other: Collider) {
    UIManager.Instance.display("ShopPanel");
    this.recycle();
  }

  private _npcWiseCollider(self: Collider, other: Collider) {
    UIManager.Instance.display("SkillPanel");
    this.recycle();
  }

  private _collisionDispose(info: ICollisionEvent | ITriggerEvent) {
    const self = info.selfCollider;
    const other = info.otherCollider;

    switch (this.colliderType) {
      case ColliderItemType.ARROW:
        this._arrowCollider(self, other);
        break;
      case ColliderItemType.HEART_BIG:
        this._heartBigCollider(self, other);
        break;
      case ColliderItemType.WARP_GATE:
        this._gateCollider(self, other);
        break;
      case ColliderItemType.NPC_BUSINESS_MAN:
        this._npcBusinessCollider(self, other);
        break;
      case ColliderItemType.NPC_WISE_MAN:
        this._npcWiseCollider(self, other);
        break;
      case ColliderItemType.HEART_SMALL:
        this._heartSmallCollider(self, other);
        break;
    }
  }

  private _collisionOverDispose(info: ICollisionEvent | ITriggerEvent) {}

  recycle() {
    PoolManager.instance.putNode(this.node);
  }

  protected onEnable(): void {
    this._colliderComp.on("onCollisionEnter", this._onColliderEnter, this);
    this._colliderComp.on("onCollisionExit", this._onColliderExit, this);
    this._colliderComp.on("onTriggerEnter", this._onTriggerStart, this);
    this._colliderComp.on("onTriggerExit", this._onTriggerEnd, this);
  }

  protected onDisable(): void {
    this._colliderComp.off("onCollisionEnter", this._onColliderEnter, this);
    this._colliderComp.off("onCollisionExit", this._onColliderExit, this);
    this._colliderComp.off("onTriggerEnter", this._onTriggerStart, this);
    this._colliderComp.off("onTriggerExit", this._onTriggerEnd, this);
  }

  private _onColliderEnter(info: ICollisionEvent) {
    this._collisionDispose(info);
  }

  private _onColliderExit(info: ICollisionEvent) {
    this._collisionOverDispose(info);
  }

  private _onTriggerStart(info: ITriggerEvent) {
    this._collisionDispose(info);
  }

  private _onTriggerEnd(info: ITriggerEvent) {
    this._collisionOverDispose(info);
  }
}
