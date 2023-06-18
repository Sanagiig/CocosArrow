import { _decorator, Collider, Component, ICollisionEvent, ITriggerEvent, Node } from "cc";
import { BaseInfoType, MonsterSkillInfo } from "../../DataCenter/DataType";
import { Constant } from "../../Base/Constant";
import { Player } from "../../Player/Player";
const { ccclass, property } = _decorator;

export const enum MonsterSkillColliderType {
  ENERGY_BALL = 1, //直线飞行能量球
  FIRE_BALL = 2, //线飞行的小火球
  JET_FIRES = 3, //直线范围型的火焰
  DISPERSION = 4, //180度散射
  TORNADO = 5, //旋转前进的龙卷风
  FIRE_BALL_BIG = 6, //直线下坠的大火团
  DISPERSION_SURROUND = 7, //360度六角形散射
  LASER = 8, //直线激光
}

interface SkillCtr {
  baseInfo: BaseInfoType;
  skillInfo: MonsterSkillInfo;
  recycle: () => void;
}

@ccclass("MonsterSkillCollider")
export class MonsterSkillCollider extends Component {
  private _colliderComp: Collider;

  private _colliderType: MonsterSkillColliderType = MonsterSkillColliderType.ENERGY_BALL;
  private _monBaseInfo: BaseInfoType;
  private _skillInfo: MonsterSkillInfo;
  private _skillCtr: SkillCtr;

  private _hitTime: number = 0;
  private _hitTimeLimit = 500;
  protected onLoad(): void {}

  init(type: MonsterSkillColliderType, ctr: SkillCtr, colliderNode: Node) {
    this._hitTime = 0;
    this._colliderType = type;
    this._monBaseInfo = ctr.baseInfo;
    this._skillInfo = ctr.skillInfo;
    this._skillCtr = ctr;
    this._colliderComp = colliderNode.getComponent(Collider);
    this.onEnable();
  }

  protected onEnable(): void {
    if (!this._colliderComp) {
      return;
    }
    this._colliderComp.on("onCollisionStay", this._onColliderStay, this);
    this._colliderComp.on("onCollisionExit", this._onColliderExit, this);
    this._colliderComp.on("onTriggerStay", this._onTriggerStay, this);
    this._colliderComp.on("onTriggerExit", this._onTriggerEnd, this);
  }

  protected onDisable(): void {
    if (!this._colliderComp) {
      return;
    }
    this._colliderComp.off("onCollisionStay", this._onColliderStay, this);
    this._colliderComp.off("onCollisionExit", this._onColliderExit, this);
    this._colliderComp.off("onTriggerStay", this._onTriggerStay, this);
    this._colliderComp.off("onTriggerExit", this._onTriggerEnd, this);
  }

  private _collisionDispose(info: ICollisionEvent | ITriggerEvent) {
    const self = info.selfCollider;
    const other = info.otherCollider;

    if (!this._skillInfo.penetrate) {
      switch (this._colliderType) {
        case MonsterSkillColliderType.DISPERSION:
        case MonsterSkillColliderType.DISPERSION_SURROUND:
          this.node.active = false;
          break;
        default:
          if(!this._skillInfo.penetrate){
            this._skillCtr.recycle();
          }
      }
    }

    if (Constant.PHY_GROUP.PLAYER === other.getGroup()) {
      this._hitPlayer();
    }
  }

  private _hitPlayer() {
    const now = Date.now();
    if (now - this._hitTime > this._hitTimeLimit) {
      this._hitTime = now;
      Player.Instance.hurted(this._monBaseInfo);
    }
  }

  private _collisionOverDispose(info: ICollisionEvent | ITriggerEvent) {}

  private _onColliderStay(info: ICollisionEvent) {
    this._collisionDispose(info);
  }

  private _onColliderExit(info: ICollisionEvent) {
    this._collisionOverDispose(info);
  }

  private _onTriggerStay(info: ITriggerEvent) {
    this._collisionDispose(info);
  }

  private _onTriggerEnd(info: ITriggerEvent) {
    this._collisionOverDispose(info);
  }
}
