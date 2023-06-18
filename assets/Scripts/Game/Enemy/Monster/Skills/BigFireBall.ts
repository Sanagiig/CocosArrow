import { _decorator, Component, Node, tween, Tween, v3, Vec3 } from "cc";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { EffectManager } from "../../../Effect/EffectManager";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { TimerManager } from "../../../../Framework/Managers/TimerManager/TimerManager";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { Constant } from "../../../Base/Constant";
const { ccclass, property } = _decorator;

@ccclass("BigFireBall")
export class BigFireBall extends Component {
  private _startPos = v3();
  private _endPos = v3();
  private _tween: Tween<any> = null!;
  private _curSpeed = 0;

  private _maxHeight = 20;
  private _totalTime = 0;

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._curSpeed = skillInfo.flySpeed;
    this._startPos = startPos;
    this._endPos = endPos;
    this._totalTime = this._maxHeight / this._curSpeed;

    this.node.active = true;
    this.node.setWorldPosition(endPos.x, this._maxHeight, endPos.z);
    this.display();
  }

  private _stopTween() {
    if (this._tween) {
      this._tween.stop();
    }
  }

  private _setupHitEffect() {
    const hitNode = EffectManager.Instance.getEffectNode("hitFireBall1");
    const skillColliderCtr =
      hitNode.getComponent(MonsterSkillCollider) || hitNode.addComponent(MonsterSkillCollider);

    skillColliderCtr.init(MonsterSkillColliderType.FIRE_BALL_BIG, this, hitNode);
    hitNode.setWorldPosition(this._endPos);
    return hitNode;
  }

  display() {
    this._stopTween();
    
    AudioManager.Instance.playSound(Constant.SOUND.FIRE_BALL_BIG);
    this._tween = tween(this.node)
      .to(this._totalTime, { worldPosition: this._endPos })
      .call(() => {
        const hitEffectNode = this._setupHitEffect();
        TimerManager.Instance.Once(() => {
          this.recycle();
        }, 0.2);

        TimerManager.Instance.Once(() => {
          PoolManager.instance.putNode(hitEffectNode);
        }, 2);
      })
      .start();
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }
}
