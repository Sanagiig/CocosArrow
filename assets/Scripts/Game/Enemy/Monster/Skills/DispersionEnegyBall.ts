import { _decorator, Component, Node, Tween, v3, Vec3 } from "cc";
import { MonsterSkillCollider, MonsterSkillColliderType } from "../MonsterSkillCollider";
import { BaseInfoType, MonsterSkillInfo } from "../../../DataCenter/DataType";
import { PoolManager } from "../../../../Framework/Managers/PoolManager/PoolManager";
import { Constant } from "../../../Base/Constant";
import { AudioManager } from "../../../../Framework/Managers/AudioManager/AudioManager";
import { GameApp } from "../../../GameApp";
import { EffectManager } from "../../../Effect/EffectManager";
const { ccclass, property } = _decorator;

type EnegyBallInfo = {};

@ccclass("DispersionEnegyBall")
export class DispersionEnegyBall extends Component {
  private _colliders: MonsterSkillCollider[] = []!;
  private _curSpeed = 0;
  private _maxRadius = 25;

  private _startPos = v3();
  private _endPos = v3();
  private _offset = v3();

  public skillInfo: MonsterSkillInfo = null!; //技能信息
  public baseInfo: BaseInfoType = null!; //基础信息

  protected onLoad(): void {
    this._colliders.length = 0;
    this.node.children.forEach((ball, i) => {
      this._colliders[i] = ball.getComponent(MonsterSkillCollider) || ball.addComponent(MonsterSkillCollider);
    });
    console.log("DispersionEnegyBall", this);
  }

  public setup(baseInfo: BaseInfoType, skillInfo: MonsterSkillInfo, startPos: Vec3, endPos: Vec3) {
    this.skillInfo = skillInfo;
    this.baseInfo = baseInfo;
    this._curSpeed = skillInfo.flySpeed;
    this._startPos = startPos;
    this._endPos = endPos;

    Vec3.subtract(this._offset, endPos, startPos).normalize();
    this.node.forward = this._offset;
    this.node.setWorldPosition(startPos.x, 2.5, startPos.z);

    AudioManager.Instance.playSound(Constant.SOUND.ENERGY_BALL);
    this.display();
  }

  private _isAlive() {
    return GameApp.Instance.isGameStart && !GameApp.Instance.isGamePause;
  }

  private _isToMaxRadius() {
    const children = this.node.children;
    const v = v3();
    for (let i = 0; i < children.length; i++) {
      const ball = children[i];
      Vec3.subtract(v, this._startPos, ball.worldPosition);
      if (v.length() >= this._maxRadius) {
        return true;
      }
    }

    return false;
  }

  display() {
    const children = this.node.children;

    this._colliders.forEach(collider => {
      // 能量球归位
      const pos = collider.node.getPosition();
      collider.node.active = true;
      collider.node.setPosition(pos.normalize().multiplyScalar(1.5));
      collider.init(MonsterSkillColliderType.DISPERSION, this, collider.node);
    });

    children.forEach(ball => {
      EffectManager.Instance.playNodeTail(ball);
    });
  }

  recycle() {
    PoolManager.instance.putNode(this.node);
  }

  protected update(dt: number): void {
    if (this._isAlive()) {
      if (this._isToMaxRadius()) {
        this.recycle();
      }

      this.node.children.forEach(ball => {
        ball.translate(v3(0, 0, -dt * this._curSpeed), Node.NodeSpace.LOCAL);
      });
    }
  }
}
