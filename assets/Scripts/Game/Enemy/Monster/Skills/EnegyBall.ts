import { _decorator, Component, Node, Tween, v3, Vec3 } from "cc";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { Constant } from "../../../Base/Constant";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { GameApp } from "../../../GameApp";
import { EffectManager } from "../../../Effect/EffectManager";
const { ccclass, property } = _decorator;

@ccclass("EnegyBall")
export class EnegyBall extends Component {
  private _collider: MonsterSkillCollider = null!;
  private _curSpeed = 0;
  private _maxRadius = 25;

  private _startPos = v3();
  private _endPos = v3();
  private _offset = v3();

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  protected onLoad(): void {
    this._collider = this.getComponent(MonsterSkillCollider);

    if (!this._collider) {
      this._collider = this.addComponent(MonsterSkillCollider);
    }
  }

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._curSpeed = skillInfo.flySpeed;
    this._startPos = startPos;
    this._endPos = endPos;
    this._maxRadius = baseInfo.attackRadius
    Vec3.subtract(this._offset, endPos,startPos).normalize();
    this.node.forward = this._offset;
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);
    this._collider.init(MonsterSkillColliderType.ENERGY_BALL, this, this.node);

    EffectManager.Instance.playNodeTail(this.node);
    AudioManager.Instance.playSound(Constant.SOUND.ENERGY_BALL);
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }

  private _isAlive() {
    return GameApp.Instance.isGameStart && !GameApp.Instance.isGamePause;
  }

  protected update(dt: number): void {
    if (this._isAlive()) {
      Vec3.subtract(this._offset, this.node.getWorldPosition(), this._startPos);
      if (this._offset.length() >= this._maxRadius) {
        this.recycle();
      }

      this.node.translate(v3(0, 0, -dt * this._curSpeed), Node.NodeSpace.LOCAL);
    }
  }
}
