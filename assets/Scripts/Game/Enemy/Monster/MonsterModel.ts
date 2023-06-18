import {
  _decorator,
  Component,
  Node,
  SkeletalAnimationComponent,
  SkeletalAnimationState,
  AnimationClip,
  SkeletalAnimation,
} from "cc";

import { Constant } from "../../Base/Constant";
import { PoolManager } from "../../../Framework/Managers/PoolManager/PoolManager";
import { GameApp } from "../../GameApp";
import { Monster } from "./Monster";
const { ccclass, property } = _decorator;

@ccclass("MonsterModel")
export class MonsterModel extends Component {
  @property(SkeletalAnimationComponent)
  private _skeletonAnim: SkeletalAnimation = null!; //动画播放组件

  public isAniPlaying: Boolean = false; //当前动画是否正在播放
  public mosterCtr: Monster = null!;

  private _aniType: string = ""; //动画类型
  private _aniState: SkeletalAnimationState = null!; //动画播放状态

  //是否正在跑
  public get isRunning() {
    return this.isAniPlaying && this._aniType === Constant.MONSTER_ANI_TYPE.RUN;
  }

  //是否站立
  public get isIdle() {
    return this.isAniPlaying && this._aniType === Constant.MONSTER_ANI_TYPE.IDLE;
  }

  //是否正在攻击
  public get isAttacking() {
    return (
      this.isAniPlaying &&
      [
        Constant.MONSTER_ANI_TYPE.ATTACK,
        Constant.MONSTER_ANI_TYPE.ATTACK_1,
        Constant.MONSTER_ANI_TYPE.ATTACK_2,
      ].indexOf(this._aniType) !== -1
    );
  }

  //是否正在受到攻击
  public get isHitting() {
    return this.isAniPlaying && this._aniType === Constant.MONSTER_ANI_TYPE.HIT;
  }

  public get animComp(){
    return this._skeletonAnim;
  }

  public get animState(){
    return this._aniState;
  }

  protected onLoad(): void {
    this._skeletonAnim = this.getComponent(SkeletalAnimation);
  }

  /**
   * attack动画帧事件
   * @returns
   */
  onFrameAttack(isNormalAttack: boolean = true) {
    if (GameApp.Instance.isGameOver || GameApp.Instance.isGamePause) {
      return;
    }
    this.mosterCtr.releaseSkillToPlayer();
  }

  /**
   * 播放小怪动画
   *
   * @param {string} aniType 动画类型
   * @param {boolean} [isLoop=false] 是否循环
   * @param {Function} [callback] 回调函数
   * @param {number} [pos] 调用播放动画的位置，方便用于测试
   * @returns
   * @memberof Player
   */
  public playAni(aniType: string, hasThen: boolean = false) {
    if (aniType === this._aniType) {
      return;
    }

    this._aniState = this._skeletonAnim.getState(aniType) as SkeletalAnimationState;
    if (this._aniState) {
      switch (aniType) {
        case Constant.MONSTER_ANI_TYPE.ATTACK:
          this._aniState.speed =
            GameApp.Instance.gameSpeed * GameApp.Instance.attackSpeedAddition * this.mosterCtr.curAttackSpeed;
          break;
        case Constant.MONSTER_ANI_TYPE.ATTACK_1:
          this._aniState.speed =
            GameApp.Instance.gameSpeed * GameApp.Instance.attackSpeedAddition * this.mosterCtr.curAttackSpeed;
          break;
        case Constant.MONSTER_ANI_TYPE.ATTACK_2:
          this._aniState.speed =
            GameApp.Instance.gameSpeed * GameApp.Instance.attackSpeedAddition * this.mosterCtr.curAttackSpeed;
          break;
        case Constant.MONSTER_ANI_TYPE.RUN:
          this._aniState.speed =
            GameApp.Instance.gameSpeed *
            ((this.mosterCtr.curMoveSpeed * GameApp.Instance.moveSpeedAddition) /
              this.mosterCtr.baseInfo.moveSpeed);
          break;
        case Constant.MONSTER_ANI_TYPE.IDLE:
          this._aniState.speed = GameApp.Instance.gameSpeed;
          break;
        default:
          this._aniState.speed = GameApp.Instance.gameSpeed;
          break;
      }
    }

    this._aniType = aniType;
    this._skeletonAnim.play(aniType);
    this.isAniPlaying = true;

    if (hasThen) {
      return new Promise((res, rej) => {
        this._skeletonAnim.once(SkeletalAnimationComponent.EventType.FINISHED, () => {
          this.isAniPlaying = false;
          res(aniType);
        });
      });
    }
  }
}
