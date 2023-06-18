import {
  _decorator,
  Component,
  Node,
  Prefab,
  ParticleSystemComponent,
  Vec3,
  Constructor,
  Animation,
} from "cc";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
// import { Reward } from "../fight/reward";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { WarningCircle } from "../WarningSkill/WarningCircle";
import { WarningLine } from "../WarningSkill/WarningLine";
import { TimerManager } from "../../Framework/Managers/TimerManager/TimerManager";
import { WarningController } from "../WarningSkill/WarningType";
import { WarningStrip } from "../WarningSkill/WarningStrip";
import { BaseInfoType, MonsterSkillInfo } from "../DataCenter/DataType";
import { Laser } from "../Enemy/Monster/Skills/Laser";
import { EnegyBall } from "../Enemy/Monster/Skills/EnegyBall";
import { FireBall } from "../Enemy/Monster/Skills/FireBall";
import { BigFireBall } from "../Enemy/Monster/Skills/BigFireBall";
import { JetFire } from "../Enemy/Monster/Skills/JetFire";
import { DispersionEnegyBall } from "../Enemy/Monster/Skills/DispersionEnegyBall";
import { Tornado } from "../Enemy/Monster/Skills/Tornado";
import { Reward } from "./Reward";
import { PrefabManager } from "../Base/PrefabManager";
const v3_goldPos: Vec3 = new Vec3();
const { ccclass, property } = _decorator;

export type MonSkillEffectCtr =
  | Laser
  | EnegyBall
  | FireBall
  | BigFireBall
  | JetFire
  | DispersionEnegyBall
  | Tornado;
@ccclass("EffectManager")
export class EffectManager extends Component {
  static Instance: EffectManager;

  private _effectContainerNode: Node = null!;

  get effectNode() {
    return this._effectContainerNode;
  }

  protected onLoad(): void {
    if (!EffectManager.Instance) {
      EffectManager.Instance = this;
    } else {
      this.destroy();
      console.error("EffectManager was exist");
      return;
    }

    this._effectContainerNode = this.node.getChildByName("Effect")!;
  }

  getEffectNode(name: string, parent: Node = this._effectContainerNode) {
    return PrefabManager.Instance.getPrefabNode("effect", name, parent);
  }

  /**
   * 播放模型的动画
   * @param {string} path 动画节点路径
   * @param {string} aniName
   * @param {vec3} worPos 世界坐标
   * @param {boolean} isLoop 是否循环
   * @param {boolean} isRecycle 是否回收
   * @param {number} [scale=1] 缩放倍数
   * @param {Function} [callback=()=>{}] 回调函数
   */
  playAni(
    path: string,
    aniName: string,
    worPos: Vec3 = new Vec3(),
    isLoop: boolean = false,
    isRecycle: boolean = false,
    scale: number = 1,
    callback: Function = () => {},
  ) {}

  /**
   * 移除特效
   * @param {string} name  特效名称
   * @param {Node}} effectNode 特效父节点
   */
  removeEffect(name: string, effectNode: Node = this.effectNode) {}

  /**
   * 播放节点下面的动画和粒子
   */
  playEffect(
    effectName: string,
    parent: Node,
    isPlayAni: boolean = true,
    isPlayParticle: boolean = true,
    recycleTime: number = 0,
    scale: number = 1,
    offset?: Vec3 | null,
    eulerAngles?: Vec3 | null,
  ) {
    let particleMaxDuration = 0;
    let animMaxDuration = 0;

    const effectNode = this.getEffectNode(effectName, parent);
    effectNode.setScale(scale, scale, scale);
    if (offset) {
      effectNode.setPosition(offset);
    }

    if (eulerAngles) {
      effectNode.setRotationFromEuler(eulerAngles);
    }

    if (isPlayAni) {
      animMaxDuration = this._playAnim(effectNode);
    }

    if (isPlayParticle) {
      particleMaxDuration = this._playParticle(effectNode);
    }

    return new Promise((res, rej) => {
      const s = recycleTime > 0 ? recycleTime : Math.max(particleMaxDuration, animMaxDuration);
      TimerManager.Instance.Once(() => {
        PoolManager.instance.putNode(effectNode);
        res(effectName);
      }, s);
    });
  }

  private _playParticle(node: Node, speed: number = 1) {
    let particleList: ParticleSystemComponent[] = node.getComponentsInChildren(ParticleSystemComponent);
    let maxDuration = 0;

    particleList.forEach((element: ParticleSystemComponent) => {
      if (!element.node.active) {
        return;
      }
      element.simulationSpeed = speed;
      element?.clear();
      element?.stop();
      element?.play();

      let duration: number = element.duration;
      maxDuration = Math.max(duration, maxDuration);
    });

    return maxDuration;
  }

  private _playAnim(node: Node, speed: number = 1) {
    let arrAni: Animation[] = node.getComponentsInChildren(Animation);
    let maxDuration = 0;

    arrAni.forEach((element: Animation, idx: number) => {
      const aniName = element?.defaultClip?.name;
      if (aniName) {
        const aniState = element.getState(aniName);
        if (aniState) {
          const duration = aniState.duration;
          maxDuration = duration > maxDuration ? duration : maxDuration;
          aniState.speed = speed;
          aniState.speed = 1;
        }
      }

      element.play();
    });

    return maxDuration;
  }

  private _playTail(node: Node, speed: number = 1, recycleTime: number = -1): Promise<any> | void {
    const maxDuration = this._playParticle(node, speed);
    if (recycleTime >= 0) {
      let seconds: number = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;
      return new Promise<any>((res, rej) => {
        TimerManager.Instance.Once(() => {
          res(seconds);
        }, seconds);
      });
    }
  }
  /**
   * 播放拖尾特效
   *
   * @param {Node} effectNode
   * @memberof EffectManager
   */
  playTail(name: string, speed: number = 1, recycleTime: number = -1) {
    const effectNode = this.getEffectNode(name);
    if (!effectNode) {
      console.error("effect not exist", name);
      return;
    }
    this._playTail(effectNode, speed, recycleTime);
  }

  playNodeTail(node: Node, speed: number = 1) {
    this._playTail(node, speed);
  }

  /**
   * 展示预警
   *
   * @param {string} warningName
   * @param {number} scale
   * @param {*} scriptParent
   * @memberof EffectManager
   */
  genWarning(warningName: string, startPos?: Vec3, endPos?: Vec3, scale?: number) {
    let warningNode = PrefabManager.Instance.getPrefabNode("warning", warningName, this.effectNode);
    if (warningNode) {
      let warningCtr: WarningController = null;
      if (warningName === "warningLine") {
        warningCtr = warningNode.getComponent(WarningLine) || warningNode.addComponent(WarningLine);
      } else if (warningName === "warningStrip") {
        warningCtr = warningNode.getComponent(WarningStrip) || warningNode.addComponent(WarningStrip);
      } else if (warningName === "warningCircle") {
        warningCtr = warningNode.getComponent(WarningCircle) || warningNode.addComponent(WarningCircle);
      }

      if (startPos && endPos && scale) {
        warningCtr.setup(startPos, endPos, scale);
      }
      return warningCtr;
    }
  }

  genEffect(
    baseInfo: BaseInfoType,
    skillInfo: MonsterSkillInfo,
    startPos: Vec3,
    endPos: Vec3,
    parentNode: Node = this._effectContainerNode,
  ) {
    const node = this.getEffectNode(skillInfo.resName, parentNode);
    let ctr: MonSkillEffectCtr = null;
    switch (skillInfo.resName) {
      case "energyBall":
        ctr = node.getComponent(EnegyBall) || node.addComponent(EnegyBall)!;
        break;
      case "fireBall":
        ctr = node.getComponent(FireBall) || node.addComponent(FireBall)!;
        break;
      case "jetFires":
        ctr = node.getComponent(JetFire) || node.addComponent(JetFire)!;
        break;
      case "dispersion":
        ctr = node.getComponent(DispersionEnegyBall) || node.addComponent(DispersionEnegyBall)!;
        break;
      case "tornado":
        ctr = node.getComponent(Tornado) || node.addComponent(Tornado)!;
        break;
      case "fireBallBig":
        ctr = node.getComponent(BigFireBall) || node.addComponent(BigFireBall)!;
        break;
      case "dispersionSurround":
        ctr = node.getComponent(DispersionEnegyBall) || node.addComponent(DispersionEnegyBall)!;
        break;
      case "laser":
        ctr = node.getComponent(Laser) || node.addComponent(Laser)!;
        break;
      default:
        console.error("资源不存在");
        return;
    }

    ctr.setup(baseInfo, skillInfo, startPos, endPos);
    return ctr;
  }

  genReward(baseInfo: BaseInfoType, node: Node) {
    let count = baseInfo.goldNum;
    while (count--) {
      const effNodes: Node[] = [];
      let rewardCtr: Reward;

      if (baseInfo.heartDropRate > Math.random()) {
        effNodes.push(PrefabManager.Instance.getPrefabNode("model", "heart", this.effectNode));
      }

      effNodes.push(PrefabManager.Instance.getPrefabNode("model", "gold", this.effectNode));
      effNodes.forEach(en => {
        rewardCtr = en.getComponent(Reward) || en.addComponent(Reward);
        rewardCtr.setup(baseInfo, node.getWorldPosition(), count);
        this._playTail(en);
      });
    }
  }

  showLightningChain(effectNode: Node, ndTarget: Node) {
    let ndEffect = PrefabManager.Instance.getPrefabNode("effect", "lightningChain", effectNode);
    ndEffect.setWorldPosition(new Vec3(effectNode.worldPosition.x, 2.3, effectNode.worldPosition.z));

    let offsetPos: Vec3 = new Vec3();

    Vec3.subtract(offsetPos, ndTarget.worldPosition, effectNode.worldPosition);
    ndEffect.setWorldScale(1, offsetPos.length(), 1);
    ndEffect.forward = offsetPos.normalize().negative();

    setTimeout(() => {
      PoolManager.instance.putNode(ndEffect);
    }, 100);
  }
}
