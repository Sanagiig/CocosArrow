import { _decorator, Component, Node, ParticleSystem, tween, Tween, v3, Vec2, Vec3 } from "cc";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { Constant } from "../../../Base/Constant";
import { EffectManager } from "../../../Effect/EffectManager";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
const { ccclass, property } = _decorator;
//激光技能组件
@ccclass("Laser")
export class Laser extends Component {
  private _particle: ParticleSystem = null!;
  private _collider: MonsterSkillCollider = null!;
  private _tween: Tween<any> = null!; //

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  protected onLoad(): void {
    this._collider = this.getComponent(MonsterSkillCollider);
    this._particle = this.node.getChildByName("vulcan_projectile").getComponent(ParticleSystem);

    if (!this._collider) {
      this._collider = this.addComponent(MonsterSkillCollider);
    }
  }

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    const forward = v3();

    Vec3.subtract(forward, endPos, startPos).normalize();

    startPos.add(forward.clone().multiplyScalar(1.5));
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);
    this.node.forward = forward;
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;

    this._collider.init(MonsterSkillColliderType.LASER, this, this.node.getChildByName("boxCollider"));

    AudioManager.Instance.playSound(Constant.SOUND.LASER);
    this._reset();
    this.display();
  }

  private _reset() {
    const particleRender = this._particle.renderer;

    this.node.active = true;
    particleRender.lengthScale = 0;
  }

  private _stopTween() {
    if (this._tween) {
      this._tween.stop();
    }
  }

  display() {
    const len = this.baseInfo.attackRadius;
    this._stopTween();

    this._particle.renderer.lengthScale = -len;
    this.node.setScale(1, 1, len);
    this.hide();
  }

  hide() {
    this._stopTween();
    this._tween = tween(this.node)
      .delay(1)
      .call(() => {
        this.recycle();
      })
      .start();
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }
}
