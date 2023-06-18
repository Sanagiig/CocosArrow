import { _decorator, Component, Node, ParticleSystem, ParticleSystemComponent, Vec3 } from "cc";
import { GameApp } from "../GameApp";
import DataUtil from "../../Framework/Utils/Shared/DataUtil";
import { Constant } from "../Base/Constant";
import { AudioManager } from "../../Framework/Managers/AudioManager/AudioManager";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { Player } from "../Player/Player";
import { PrefabManager } from "../Base/PrefabManager";

const { ccclass, property } = _decorator;

@ccclass("Arrow")
export class Arrow extends Component {
  public isAutoRotate: boolean = true; //箭是否自动调整角度

  private _bodyNode: Node = null!; //放弓箭特效的节点
  private _curSpeed: number = 0; //当前速度
  private _targetSpeed: number = 0; //目标速度
  private _oriPos: Vec3 = null!; //初始默认位置
  private _oriEulerAngles: Vec3 = null!; //初始默认角度
  private _offsetPos: Vec3 = new Vec3(); //和玩家之间的向量差
  private _curWorPos: Vec3 = new Vec3(); //当前节点世界坐标
  private _effectNode: Node = null!;
  private _disappearRange: number = 25; //箭节点超过玩家这个范围则隐藏
  private _targetWorPos: Vec3 = new Vec3(); //箭的下次目标位置

  private _oriForward: Vec3 = null!; //初始朝向
  private _curForward: Vec3 = new Vec3(); //当前朝向
  private _releaseWorPos: Vec3 = new Vec3(); //技能释放位置的世界坐标

  public init(speed: number, releaseWorPos: Vec3) {
    this._releaseWorPos.set(releaseWorPos);

    if (!this._bodyNode) {
      this._bodyNode = this.node.getChildByName("body") as Node;
    }

    if (!this._oriPos) {
      this._oriPos = this.node.position.clone();
    }

    if (!this._oriEulerAngles) {
      this._oriEulerAngles = this.node.eulerAngles.clone();
    }

    if (!this._oriForward) {
      this._oriForward = this.node.forward.clone();
    }

    if (!this._effectNode) {
      this._effectNode = PrefabManager.Instance.getPrefabNode("effect", "arrowAll", this.node);
      this._effectNode.setScale(4.5,2.5,4.5)
    }

    // 隐藏所有特效
    this._effectNode.getChildByName("body").children.forEach(item => {
      item.active = false;
    });

    this.node.setPosition(this._oriPos);
    this.node.eulerAngles = this._oriEulerAngles;
    this._curForward.set(this._oriForward);

    this._targetSpeed = speed;
    this._curSpeed = speed * 0.5;

    this.display();
  }

  /**
   * 展示箭的特效拖尾
   *
   * @private
   * @param {string} effectName
   * @memberof Arrow
   */
  private _showTail(effectName: string) {}

  /**
   *  回收弓箭组，在weapon/arrow下
   *
   * @memberof Arrow
   */
  public recycleArrowGroup() {
    if (this.node.parent) {
      PoolManager.instance.putNode(this.node.parent);
    }
  }

  public display() {
    const effectBody = this._effectNode.getChildByName("body");
    const isHasIce = Player.Instance.hasArrowIce;
    const isHasFire = Player.Instance.hasArrowFire;
    const isHasLightning = Player.Instance.hasArrowLightning;

    if (isHasFire) {
      AudioManager.Instance.playSound(Constant.SOUND.FIRE);
      effectBody.getChildByName("fire").active = true;
      effectBody.getChildByName("fire").getComponent(ParticleSystem).play();
    }

    if (isHasIce) {
      AudioManager.Instance.playSound(Constant.SOUND.ICE);
      effectBody.getChildByName("ice").active = true;
      effectBody.getChildByName("ice").getComponent(ParticleSystem).play();
    }

    if (isHasLightning) {
      AudioManager.Instance.playSound(Constant.SOUND.LIGHTNING);
      effectBody.getChildByName("lightning").active = true;
      effectBody.getChildByName("lightning").getComponent(ParticleSystem).play();
    }

    if (isHasFire && isHasIce && isHasLightning) {
      effectBody.getChildByName("trail").active = true;
    }

    this.node.active = true;
  }

  /**
   * 击中目标,隐藏箭
   *
   * @memberof Arrow
   */
  public hide() {
    if (!this.node.parent) {
      return;
    }

    //清除拖尾特效残留
    let arrParticle: ParticleSystemComponent[] =
      this._bodyNode.getComponentsInChildren(ParticleSystemComponent);
    arrParticle.forEach((item: ParticleSystemComponent) => {
      item.simulationSpeed = 1;
      item?.clear();
      item?.stop();
    });

    this.node.active = false;

    //如果弓箭组里所有的箭都隐藏了则回收整个弓箭组
    let isAllArrowHide = this.node.parent?.children.every((ndArrow: Node) => {
      return ndArrow.active === false;
    });

    if (isAllArrowHide) {
      this.recycleArrowGroup();
    }
  }

  /**
   * 箭弹射给一定范围内的某个敌人
   *
   * @param {Node} ndMonster
   * @memberof Arrow
   */
  public playArrowLaunch(ndMonster: Node) {}

  update(deltaTime: number) {
    if (!this.node.parent || GameApp.Instance.isGameOver || GameApp.Instance.isGamePause) {
      return;
    }
    //朝forward方向飞行
    this._curSpeed = DataUtil.lerp(this._targetSpeed, this._curSpeed, 0.25);
    this._targetWorPos.set(0, 0, -deltaTime * this._curSpeed);
    this.node.translate(this._targetWorPos, Node.NodeSpace.LOCAL);
    this._curWorPos.set(this.node.worldPosition);
  }
}
