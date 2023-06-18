import {
  _decorator,
  Component,
  Node,
  Vec3,
  SkeletalAnimationState,
  AnimationClip,
  SkeletalAnimationComponent,
  Game,
  SkeletalAnimation,
} from "cc";
import { EffectManager } from "../Effect/EffectManager";
import { GameApp } from "../GameApp";
import { Constant } from "../Base/Constant";
import { AudioManager } from "../../Framework/Managers/AudioManager/AudioManager";
import { Player } from "./Player";
const { ccclass, property } = _decorator;

@ccclass("PlayerModelController")
export class PlayerModelController extends Component {
  private _aniType: string = ""; //动画类型
  private _aniState: SkeletalAnimationState = null!; //动画播放状态
  private _stepIndex: number = 0; //脚步

  socketLooseNode: Node = null!; //弓箭发射的节点
  socketHandNode: Node = null!; //手节点
  arrowNode: Node = null!; //攻击时候展示的弓箭
  skeletonAnim: SkeletalAnimationComponent = null!; //动画播放组件

  looseEulerAngles: Vec3 = new Vec3(); //射箭时的角度
  isAniPlaying: boolean = false; //当前动画是否正在播放

  //是否正在跑
  get isRunning() {
    return this._aniType === Constant.PLAYER_ANI_TYPE.RUN && this.isAniPlaying === true;
  }

  //是否站立
  get isIdle() {
    return this._aniType === Constant.PLAYER_ANI_TYPE.IDLE && this.isAniPlaying === true;
  }

  //是否正在攻击
  get isAttacking() {
    return this._aniType === Constant.PLAYER_ANI_TYPE.ATTACK && this.isAniPlaying === true;
  }

  protected onLoad(): void {
    this.skeletonAnim = this.node.getComponent(SkeletalAnimation);
    this._init();
  }

  private _init() {
    // 不加延时找不到 arrow
    setTimeout(() => {
      this.arrowNode = this.node.getChildByPath("gongjian_la Socket/arrow");
      this.hideArrow();
      this.playAni(Constant.PLAYER_ANI_TYPE.IDLE);
    });
  }

  onFrameAttackLoose() {
    if (GameApp.Instance.isGameOver || GameApp.Instance.isGamePause) {
      return;
    }

    this.looseEulerAngles = this.node.parent?.eulerAngles as Vec3;
    GameApp.Instance.player.throwArrowToEnemy();
    this.arrowNode.active = false;
  }

  /**
   * 跑步的时候播放音效
   */
  onRunFrame() {
    this._stepIndex = this._stepIndex === 0 ? 1 : 0;
    AudioManager.Instance.playSound(Constant.SOUND.FOOT_STEP[this._stepIndex]);
  }

  onAttackFrame(){
    AudioManager.Instance.playSound(Constant.SOUND.LOOSE);
    Player.Instance.throwArrowToEnemy();
    this.hideArrow();
  }

  showArrow() {
    this.arrowNode.active = true;
  }

  hideArrow() {
    this.arrowNode.active = false;
  }

  /**
   * 播放玩家动画
   *
   * @param {string} aniType 动画类型
   * @param {boolean} [hasThen] 是否返回结束动画的promise
   * @returns
   * @memberof Player
   */
  playAni(aniType: string, hasThen: boolean = false) {
    this._aniState = this.skeletonAnim?.getState(aniType) as SkeletalAnimationState;

    if (this._aniState && this._aniState.isPlaying) {
      return;
    }

    this._aniType = aniType;

    if (this._aniType !== Constant.PLAYER_ANI_TYPE.ATTACK) {
      this.hideArrow();
    }

    this.skeletonAnim?.play(aniType);
    this.isAniPlaying = true;

    switch (aniType) {
      case Constant.PLAYER_ANI_TYPE.ATTACK:
        this._aniState.speed = GameApp.Instance.gameSpeed * GameApp.Instance.player.curAttackSpeed;
        this.showArrow();
        GameApp.Instance.player.hideRunSmoke();
        break;
      case Constant.PLAYER_ANI_TYPE.RUN:
        this._aniState.speed =
          GameApp.Instance.gameSpeed *
          (Player.Instance.curMoveSpeed / Player.Instance.baseInfo.moveSpeed);
        break;
      case Constant.PLAYER_ANI_TYPE.IDLE:
        this._aniState.speed = GameApp.Instance.gameSpeed;
        break;
      default:
        this._aniState.speed = GameApp.Instance.gameSpeed;
        break;
    }

    if (hasThen) {
      return new Promise<string>((res, rej) => {
        this.skeletonAnim.once(SkeletalAnimationComponent.EventType.FINISHED, () => {
          this.isAniPlaying = false;
          res(aniType);
        });
      });
    }
  }

  test() {
    console.log("test");
  }

  test1() {
    console.log("test1");
  }
  protected onEnable(): void {
    const runEvents: AnimationClip.IEvent[] = [{ frame: 0.02, func: "test", params: [] }];
    const runClip = this.skeletonAnim.clips[4];
    runClip.events = runEvents;
    console.log("this.skeletonAnim", this.skeletonAnim, runClip);
  }

  protected onDisable(): void {}
}
