import { _decorator, Component, Node, v3, Vec3 } from "cc";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { EffectManager } from "../../../Effect/EffectManager";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { Constant } from "../../../Base/Constant";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { TimerManager } from "../../../../Framework/Managers/TimerManager/TimerManager";
const { ccclass, property } = _decorator;

@ccclass("FireBall")
export class FireBall extends Component {
  private _startPos = v3();
  private _endPos = v3();
  private _offset = v3();
  private _nextPos = v3();
  private _curSpeed = 0;

  private _maxHeight = 3;
  private _spanTime = 0;
  private _totalTime = 0;
  private _isActive = true;
  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._curSpeed = skillInfo.flySpeed;
    this._startPos = startPos;
    this._endPos = endPos;
    this._spanTime = 0;

    Vec3.subtract(this._offset, endPos, startPos);
    this._totalTime = this._offset.length() / this._curSpeed;

    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);
    this.node.forward = this._offset.clone().normalize();

    this._isActive = true;
    EffectManager.Instance.playNodeTail(this.node);
    AudioManager.Instance.playSound(Constant.SOUND.FIRE_BALL);
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }

  private _setupHitEffect() {
    const hitNode = EffectManager.Instance.getEffectNode("hitFireBall1");
    const skillColliderCtr =
      hitNode.getComponent(MonsterSkillCollider) || hitNode.addComponent(MonsterSkillCollider);

    skillColliderCtr.init(MonsterSkillColliderType.FIRE_BALL, this, hitNode);
    hitNode.setWorldPosition(this._endPos);
    return hitNode;
  }

  protected update(dt: number): void {
    if (!this._isActive) {
      return;
    }

    this._spanTime += dt;
    if (this._spanTime >= this._totalTime) {
      const hitEffectNode = this._setupHitEffect();

      this._isActive = false;
      this.node.setWorldPosition(this._endPos);
      EffectManager.Instance.playNodeTail(hitEffectNode);

      TimerManager.Instance.Once(() => {
        this.recycle();
      }, 0.3);

      setTimeout(() => {
        PoolManager.instance.putNode(hitEffectNode);
      }, 2000);
      return;
    }

    const percent = this._spanTime / this._totalTime;
    const height = Math.sin(percent * Math.PI) * this._maxHeight + 2;

    Vec3.add(this._nextPos, this._startPos, this._offset.clone().multiplyScalar(percent));
    this.node.setWorldPosition(this._nextPos.x, height, this._nextPos.z);
  }
}
