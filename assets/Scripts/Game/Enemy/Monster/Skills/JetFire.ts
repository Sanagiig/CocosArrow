import {
  _decorator,
  Animation,
  AudioSource,
  Component,
  Node,
  ParticleSystem,
  ParticleSystemComponent,
  tween,
  Tween,
  v3,
  Vec3,
} from "cc";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { EffectManager } from "../../../Effect/EffectManager";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { Constant } from "../../../Base/Constant";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { TimerManager } from "../../../../Framework/Managers/TimerManager/TimerManager";

const { ccclass, property } = _decorator;

@ccclass("JetFire")
export class JetFire extends Component {
  private _boxColliderNode: Node = null!;
  private _collider: MonsterSkillCollider = null!;
  private _anim: Animation = null!;
  private _timerID: number;
  private _startPos = v3();
  private _endPos = v3();
  private _audioSound: AudioSource;

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  protected onLoad(): void {
    this._boxColliderNode = this.node.getChildByName("boxCollider");
    this._collider = this.getComponent(MonsterSkillCollider) || this.addComponent(MonsterSkillCollider);
    this._anim = this.getComponent(Animation) || this.addComponent(Animation);
    console.log("JetFire", this);
  }

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    const forward = v3();
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._startPos = startPos;
    this._endPos = endPos;

    this.node.forward = Vec3.subtract(forward, endPos, startPos).normalize().clone();
    forward.y = 0;
    this.node.setWorldPosition(forward.multiplyScalar(3).add3f(startPos.x, 2.5, startPos.z));
    this._collider.init(MonsterSkillColliderType.JET_FIRES, this, this._boxColliderNode);

    this._audioSound = AudioManager.Instance.playSound(Constant.SOUND.JET_FIRE);
    this.display();
  }

  private _resetCollider() {
    this._boxColliderNode.active = true;
    this._boxColliderNode.setScale(0.8, 0.8, 1);
  }

  private _stopTimer() {
    if (this._timerID) {
      TimerManager.Instance.Unschedule(this._timerID);
    }
  }

  private _updateEffectDuration() {
    let particleList: ParticleSystem[] = this.node.getComponentsInChildren(ParticleSystem);
    particleList.forEach(ps => {
      if (this.skillInfo.skillDuration) {
        ps.duration = this.skillInfo.skillDuration - 1;
      }
    });
  }

  display() {
    this._resetCollider();
    this._stopTimer();
    this._updateEffectDuration();

    // 播放动画（修改碰撞体的大小）
    this._anim.play();
    EffectManager.Instance.playNodeTail(this.node);
    this._timerID = TimerManager.Instance.Once(() => {
      this.recycle();
    }, this.skillInfo.skillDuration);
  }

  recycle() {
    this._stopTimer();
    this._audioSound.stop();
    PoolManager.instance.putNode(this.node);
  }
}
