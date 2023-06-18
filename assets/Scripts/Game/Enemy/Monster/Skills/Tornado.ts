import { _decorator, Component, Node, Tween, v3, Vec3 } from "cc";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { Constant } from "../../../Base/Constant";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { GameApp } from "../../../GameApp";
import { EffectManager } from "../../../Effect/EffectManager";

const { ccclass, property } = _decorator;

@ccclass("Tornado")
export class Tornado extends Component {
  private _collider: MonsterSkillCollider = null!;
  private _curSpeed = 0;
  private _crossSpeed = 4;

  private _startPos = v3();
  private _endPos = v3();
  private _travelVec = v3();
  private _offset = v3();
  //  X 轴 translate 的基数
  private _crossBaseNum = 1;
  //   旋风折返的标识
  private _crossSymbol = 1;
  private _durationTime = 0;
  private _lifeTime = 0;

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  protected onLoad(): void {
    this._collider = this.getComponent(MonsterSkillCollider) || this.addComponent(MonsterSkillCollider);
    console.log("tornado", this);
  }

  setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    const forward = v3();

    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._curSpeed = skillInfo.flySpeed;
    this._startPos = startPos;
    this._endPos = endPos;
    this._durationTime = skillInfo.skillDuration;

    Vec3.subtract(forward, endPos, startPos).normalize();

    this.node.forward = forward.clone().normalize();
    console.log("forward",endPos,forward)
    Vec3.rotateY(this._offset, forward, v3(0, 90, 0), 1).normalize();
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);

    AudioManager.Instance.playSound(Constant.SOUND.TORNADO);
    this.display();
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }

  display() {
    this._lifeTime = 0;
    this._crossSymbol = 1;
    this._crossBaseNum = 1;
    EffectManager.Instance.playNodeTail(this.node);
    this._collider.init(MonsterSkillColliderType.ENERGY_BALL, this, this.node.getChildByName("move"));
  }

  private _isAlive() {
    return GameApp.Instance.isGameStart && !GameApp.Instance.isGamePause;
  }

  protected update(dt: number): void {
    if (this._isAlive()) {
      if (this._lifeTime >= this._durationTime) {
        this.recycle();
      }

      this._lifeTime += dt;


      let xDir = Math.sin((this._lifeTime * 2 * Math.PI));

      let xoffset = dt * this._crossSpeed * this._crossBaseNum * xDir;

      if (xDir < 0 && this._crossSymbol > 0 && this._crossBaseNum == 1) {
        this._crossBaseNum *= 2;
        this._crossSymbol *=-1;
      }

      this.node.translate(v3(xoffset, 0, -dt * this._curSpeed), Node.NodeSpace.LOCAL);
    }
  }
}
