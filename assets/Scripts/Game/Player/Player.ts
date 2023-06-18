import {
  _decorator,
  Component,
  Quat,
  Vec3,
  Node,
  RigidBodyComponent,
  CapsuleColliderComponent,
  geometry,
  v3,
  instantiate,
  Prefab,
} from "cc";
// import { AudioManager } from './../framework/audioManager';
// import { Arrow } from './arrow';
// import { PlayerBloodBar } from '../ui/fight/playerBloodBar';
// import { CharacterRigid } from './characterRigid';

import { UIInfo, UIManager } from "../../Framework/Managers/UIManager/UIManager";
import { MapManager } from "../Map/MapManager";
import { DataCenter } from "../DataCenter/DataCenter";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { EventManager } from "../../Framework/Managers/EventManager/EventManager";
import { GameApp } from "../GameApp";
import { Constant } from "../Base/Constant";
import { EffectManager } from "../Effect/EffectManager";
import { PlayerModelController } from "./PlayerModelController";
import DataUtil from "../../Framework/Utils/Shared/DataUtil";
import { EntityRigidController } from "../Base/EntityRigidController";
import { MoveActionData } from "../../Framework/Utils/Joystick";
import Macro from "../../Framework/Utils/Shared/Macro";
import { BaseBloodBarController } from "../UIController/Fight/BaseBloodBarController";
import { PlayerBloodBarController } from "../UIController/Fight/PlayerBloodBarController";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { EnemyManager } from "../Enemy/EnemyManager";
import { Arrow } from "../Weapon/Arrow";
import { TimerManager } from "../../Framework/Managers/TimerManager/TimerManager";
import { BaseInfoType, PlayerSkillInfo } from "../DataCenter/DataType";
import FightTipManager from "../Fight/FightTipManager";
import { AudioManager } from "../../Framework/Managers/AudioManager/AudioManager";
import { ColliderItemController, ColliderItemType } from "../Base/ColliderItemController";
import { PrefabManager } from "../Base/PrefabManager";
import ArrayUtil from "../../Framework/Utils/Shared/ArrayUtil";
import TipBarManager from "../UIController/common/TipManager";
let qt_0 = new Quat();
let v3_0 = new Vec3();
let v3_1 = new Vec3();
let v3_2 = new Vec3();
const ray: geometry.Ray = new geometry.Ray();

const { ccclass, property } = _decorator;
@ccclass("Player")
export class Player extends Component {
  static Instance: Player;

  private _bloodUIInfo: UIInfo<BaseBloodBarController> = null!;
  private _throwArrowSpeed: number = 20; //弓箭速30
  private _searchRadius: number;
  private _nearAttackRadius: number;
  private _attackRadius: number;
  private _oriPlayerPos: Vec3 = new Vec3(0, 1.7, 0); //玩家初始世界坐标
  private _oriPlayerScale: Vec3 = new Vec3(4, 4, 4); //玩家初始缩放倍数
  private _oriPlayerAngle: Vec3 = new Vec3(0, -90, 0); //玩家初始角度
  private _runSmokeEffectNode: Node = null!; //烟雾特效
  private _originAngle: Vec3 = new Vec3(0, -90, 0); //玩家开始角度
  private _bloodPos = v3(0, 100, 0);
  private _curMoveSpeed: number = 0; //当前玩家移动速度

  private _hp: number = 0; //玩家当前生命值
  private _isDie: boolean = false; //主角是否阵亡
  private _horizontal: number = 0; //水平移动距离
  private _vertical: number = 0; //垂直移动距离

  //技能数组
  private _activeSkillList: string[] = [];
  private _buffSkillList: string[] = [];
  private _triggerSkillList: string[] = [];
  private _curSkillData: string[] = [];

  modelCtr: PlayerModelController = null!; //玩家动画组件播放脚本
  rigidCtr: EntityRigidController = null!;

  //    scriptBloodBar: PlayerBloodBar = null!; //血条绑定脚本
  isMoving: boolean = false; //玩家是否正在移动
  isPlayRotate: boolean = false; //是否旋转

  // 攻击延迟帧
  private _attackCountDown = 0;

  baseInfo: BaseInfoType = {} as BaseInfoType; //玩家在base.csv的基础数据

  // 人物数值
  // 初始数值（方便与buff 累加）
  oriAttackPower: number = 20;
  oriDefensePower: number = 1;
  oriAttackSpeed: number = 1;
  oriDodgeRate: number = 0;
  oriCriticalHitRate: number = 0;
  oriCriticalHitDamage: number = 0;
  oriMoveSpeed: number = 0;
  oriHpLimit: number = 0;

  // 当前数值（累加后得结果）
  curAttackPower: number = 20; //当前攻击力
  curDefensePower: number = 1; //当前防御力
  curAttackSpeed: number = 1; //当前攻击速度
  curDodgeRate: number = 0; //当前闪避率
  curCriticalHitRate: number = 0; //当前暴击率，0为不暴击
  curCriticalHitDamage: number = 0; //当前暴击伤害
  curHpLimit: number = 0; //当前玩家生命值上限（这个是上限，是生命上限，不是当前生命值）

  get isDie() {
    return this._isDie;
  }

  set isDie(v: boolean) {
    if (v) {
      this.goDie();
    } else {
      this._isDie = v;
    }
  }

  get curMoveSpeed() {
    return this._curMoveSpeed;
  }

  set curMoveSpeed(v: number) {
    this._curMoveSpeed = v;
    this.rigidCtr.setSpeed(v, 1);
  }

  // 两年半练习
  get hasTwoPassHalfYear() {
    return [Constant.PLAYER_SKILL.SING, Constant.PLAYER_SKILL.DANCE, Constant.PLAYER_SKILL.RAP].every(
      item => this._activeSkillList.indexOf(item) !== -1,
    );
  }

  //是否拥有技能：弓箭双重射击
  get hasArrowDouble() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_DOUBLE) != -1;
  }

  //是否拥有技能：弓箭反弹
  get hasArrowRebound() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_REBOUND) != -1;
  }

  //是否拥有技能：反向弓箭
  get hasArrowReverse() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_REVERSE) != -1;
  }

  //是否拥有技能：侧边弓箭
  get hasArrowSide() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_SIDE) != -1;
  }

  //是否拥有技能：侧边弓箭
  get hasArrowUmbrella() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_UMBRELLA) != -1;
  }

  //是否拥有技能：连续射击
  get hasArrowContinuous() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_CONTINUOUS) != -1;
  }

  //是否拥有技能：弓箭穿透射击
  get hasArrowPenetrate() {
    return this._activeSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_PENETRATE) != -1;
  }

  //是否拥有技能：冰冻
  get hasArrowIce() {
    return this._triggerSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_ICE) != -1;
  }

  //是否拥有技能：灼烧
  get hasArrowFire() {
    return this._triggerSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_FIRE) != -1;
  }

  //是否拥有技能： 闪电
  get hasArrowLightning() {
    return this._triggerSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_LIGHTNING) != -1;
  }

  //是否拥有技能：嗜血
  get hasBloodthirsty() {
    return this._triggerSkillList.indexOf(Constant.PLAYER_SKILL.BLOODTHIRSTY) != -1;
  }

  //是否拥有技能：弹射
  get hasArrowLaunch() {
    return this._triggerSkillList.indexOf(Constant.PLAYER_SKILL.ARROW_LAUNCH) != -1;
  }

  protected onLoad(): void {
    if (!Player.Instance) {
      Player.Instance = this;
    } else {
      this.destroy();
      return;
    }

    console.log("Player", this);

    this._initNodeAndComp();
    this._initData();
  }

  private _initNodeAndComp() {
    const smokePrefab = ResManager.Instance.getAsset("Prefab", "effect/runSmoke/runSmoke") as Prefab;

    this._runSmokeEffectNode = instantiate(smokePrefab);
    this.rigidCtr = this.addComponent(EntityRigidController);
    this.modelCtr = this.node.getChildByName("body").addComponent(PlayerModelController);
    this._bloodUIInfo = UIManager.Instance.loadUIViewByPath(
      "Prefab",
      "ui/fight",
      "PlayerBloodBar",
    )! as UIInfo<PlayerBloodBarController>;

    this.node.addChild(this._runSmokeEffectNode);
  }

  private _initData() {
    const csv = DataCenter.Instance.csv;
    this.isMoving = false;
    this.isDie = false;
    this.isPlayRotate = false;

    this._horizontal = 0;
    this._vertical = 0;

    // this.rigidCtr = this.node.getComponent(CharacterRigid) as CharacterRigid;

    //获取玩家基础数据
    this.baseInfo = csv.queryOneByID("base", Constant.BASE.PLAYER_01) as BaseInfoType;

    //设置玩家大小
    let arrScale = DataUtil.parseStringData(this.baseInfo.scale, ",");
    //设置角度
    let arrAngle = DataUtil.parseStringData(this.baseInfo.angle, ",");

    this._searchRadius = this.baseInfo.searchRadius;
    this._nearAttackRadius = this.baseInfo.nearAttackRadius;
    this._attackRadius = this.baseInfo.attackRadius;

    this._oriPlayerAngle.set(arrAngle[0], arrAngle[1], arrAngle[2]);
    this._oriPlayerScale.set(arrScale[0], arrScale[1], arrScale[2]);
    this.node.eulerAngles = this._oriPlayerAngle;
    this.node.setScale(this._oriPlayerScale);

    this._initOriData();
    this.resetPlayerWorPos();
    this.refreshSkill();
  }

  private _initOriData() {
    this.oriHpLimit = this._hp = this.baseInfo.hp;
    this.oriAttackPower = this.baseInfo.attackPower;
    this.oriDefensePower = this.baseInfo.defensePower;
    this.oriAttackSpeed = this.baseInfo.attackSpeed;
    this.oriDodgeRate = this.baseInfo.dodgeRate;
    this.oriCriticalHitRate = this.baseInfo.criticalHitRate;
    this.oriCriticalHitDamage = this.baseInfo.criticalHitDamage;
    this.oriMoveSpeed = this.baseInfo.moveSpeed;
  }

  private _canOperation() {
    return (
      !this._isDie &&
      GameApp.Instance.isGameStart &&
      !GameApp.Instance.isGameOver &&
      !GameApp.Instance.isGamePause
    );
  }

  /**
   * 每次成功进入新的一层则更新玩家状态
   *
   * @memberof Player
   */
  public resetPlayerState() {
    this.isMoving = false;
    this.isDie = false;
    this.isPlayRotate = false;

    this.rigidCtr.clearState();
    this._bloodUIInfo.controller.display();
    this._stopMove();
    this.resetPlayerWorPos();
    this.node.eulerAngles = this._originAngle;
    this._playAnim(Constant.PLAYER_ANI_TYPE.IDLE);
  }

  /**
   * 根据an、anS两张图设置不同的玩家初始位置
   */
  private resetPlayerWorPos() {
    let pos = DataUtil.str2V3(this.baseInfo.position);

    if (MapManager.Instance.isMapAnS) {
      this._oriPlayerPos.set(-16.742, pos.y, -0.719);
    } else {
      //设置坐标
      this._oriPlayerPos.set(pos);
    }

    this.node.setPosition(this._oriPlayerPos);
  }

  private _playAnim(aniName: string, hasThen: boolean = false) {
    if (!this.isDie) {
      return this.modelCtr.playAni(aniName, hasThen);
    }
  }

  private _stopMove() {
    this._horizontal = 0;
    this._vertical = 0;
    this.rigidCtr.stopMove();
    this._playAnim(Constant.PLAYER_ANI_TYPE.IDLE);
    this.isMoving = false;
  }

  refreshBloodBar() {
    this._bloodUIInfo.controller.setup(this.node, this._bloodPos, this.curHpLimit, this._hp);
  }

  refreshPower() {
    let hp = 0;
    let ap = this.oriAttackPower;
    let dp = this.oriDefensePower;
    let as = this.oriAttackSpeed;
    let dr = this.oriDodgeRate;
    let chr = this.oriCriticalHitRate;
    let chd = this.oriCriticalHitDamage;
    let ms = this.oriMoveSpeed;
    let table = DataCenter.Instance.csv.getTable("playerSkill");

    this._buffSkillList.forEach(skill => {
      const skillInfo = table.queryOneByID(skill) as PlayerSkillInfo;
      let val: any = skillInfo.value;
      if (val.includes("#")) {
        val = val.split("#").map(item => Number(item));
      } else {
        val = Number(val);
      }

      switch (skill) {
        case Constant.PLAYER_SKILL.RAISE_ATTACK_01:
        case Constant.PLAYER_SKILL.RAISE_ATTACK_02:
          ap += val;
          break;
        case Constant.PLAYER_SKILL.RAISE_DODGE:
          dr += val;
          break;
        case Constant.PLAYER_SKILL.RAISE_CRITICAL_HIT_DAMAGE_01:
        case Constant.PLAYER_SKILL.RAISE_CRITICAL_HIT_DAMAGE_02:
          chr += val[0];
          chd += val[1];
          break;
        case Constant.PLAYER_SKILL.RAISE_ATTACK_SPEED_01:
        case Constant.PLAYER_SKILL.RAISE_ATTACK_SPEED_02:
          as += val;
          break;
        case Constant.PLAYER_SKILL.RAISE_HP_LIMIT:
          hp += val;
          break;
        case Constant.PLAYER_SKILL.MOVE_SPEED:
          ms += val;
          break;
      }
    });

    this.curHpLimit = this.oriHpLimit;
    this.curAttackPower = ap;
    this.curDefensePower = dp;
    this.curAttackSpeed = as;
    this.curDodgeRate = dr;
    this.curCriticalHitRate = chr;
    this.curCriticalHitDamage = chd;
    this.curMoveSpeed = ms;

    if (hp > 0) {
      this.refreshBlood(hp, true);
    } else {
      this._hp = Math.min(this._hp, this.curHpLimit);
      this.refreshBloodBar();
    }
  }

  private _setupKunSound(on: boolean = true) {
    if (!on) {
      Constant.SOUND.PLAYER_01_DIE = Constant.SOUND.PLAYER_01_DIE.replace("ji_", "");
      // Constant.SOUND.LOOSE = Constant.SOUND.LOOSE.replace("ji_", "");

      return;
    }

    Constant.SOUND.PLAYER_01_DIE = "ji_" + Constant.SOUND.PLAYER_01_DIE;
    // Constant.SOUND.LOOSE = "ji_" + Constant.SOUND.LOOSE;
  }
  refreshSkill() {
    const skillData = DataCenter.Instance.getPlayerData().skillData.slice();

    if (skillData.length && ArrayUtil.equals(skillData, this._curSkillData)) {
      return;
    }

    if (skillData.length) {
      AudioManager.Instance.playSound(Constant.SOUND.GET_SKILL);
      EffectManager.Instance.playEffect("levelUp", this.node);
    }

    this._curSkillData = skillData;
    this._activeSkillList.length = 0;
    this._buffSkillList.length = 0;
    this._triggerSkillList.length = 0;

    skillData.forEach(skillID => {
      switch (skillID) {
        case Constant.PLAYER_SKILL.ARROW_DOUBLE:
        case Constant.PLAYER_SKILL.ARROW_CONTINUOUS:
        case Constant.PLAYER_SKILL.ARROW_UMBRELLA:
        case Constant.PLAYER_SKILL.ARROW_REVERSE:
        case Constant.PLAYER_SKILL.ARROW_SIDE:
        case Constant.PLAYER_SKILL.ARROW_PENETRATE:
        case Constant.PLAYER_SKILL.SING:
        case Constant.PLAYER_SKILL.DANCE:
        case Constant.PLAYER_SKILL.RAP:
          this._activeSkillList.push(skillID);
          break;
        case Constant.PLAYER_SKILL.RAISE_ATTACK_01:
        case Constant.PLAYER_SKILL.RAISE_ATTACK_02:
        case Constant.PLAYER_SKILL.RAISE_DODGE:
        case Constant.PLAYER_SKILL.RAISE_CRITICAL_HIT_DAMAGE_01:
        case Constant.PLAYER_SKILL.RAISE_CRITICAL_HIT_DAMAGE_02:
        case Constant.PLAYER_SKILL.RAISE_ATTACK_SPEED_01:
        case Constant.PLAYER_SKILL.RAISE_ATTACK_SPEED_02:
        case Constant.PLAYER_SKILL.RAISE_HP_LIMIT:
        case Constant.PLAYER_SKILL.MOVE_SPEED:
          this._buffSkillList.push(skillID);
          break;
        case Constant.PLAYER_SKILL.ARROW_ICE:
        case Constant.PLAYER_SKILL.ARROW_FIRE:
        case Constant.PLAYER_SKILL.ARROW_LIGHTNING:
        case Constant.PLAYER_SKILL.BLOODTHIRSTY:
        case Constant.PLAYER_SKILL.ARROW_LAUNCH:
          this._triggerSkillList.push(skillID);
          break;
        default:
          console.error("unkonw skillID", skillID);
      }
    });

    if (this.hasTwoPassHalfYear) {
      const playerData = DataCenter.Instance.getPlayerData();
      TipBarManager.Instance.tip("由于经过长达两年半的练习，你获得了50G，为自只因喝彩吧!");
      playerData.gold += 50;
      AudioManager.Instance.playSound(Constant.SOUND.GOLD_COLLECT);
      EventManager.Instance.emit(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER);
      this._setupKunSound();
    } else {
      this._setupKunSound(false);
    }
    this.refreshPower();
  }

  moveAction(act: MoveActionData) {
    if (!this._canOperation()) {
      return;
    }

    switch (act.type) {
      case "move":
        if (!this.modelCtr.isIdle && !this.isMoving) {
          return;
        }

        // 因为是俯视角，摇杆的角度需要 - 45度才能和在地图移动的方位一致
        let ang = act.ang - 45;
        this._horizontal = Math.cos(ang * Macro.Rad);
        this._vertical = Math.sin(ang * Macro.Rad);
        this.rigidCtr.move(this._horizontal, -this._vertical);
        this._playAnim(Constant.PLAYER_ANI_TYPE.RUN);
        this.isMoving = true;
        this._runSmokeEffectNode.active = true;
        break;
      case "stop":
        this._stopMove();
        break;
    }
  }

  private _searchMonster() {
    return EnemyManager.Instance.getNearestMonster(this.node.worldPosition, this._searchRadius);
  }

  /**
   * 向怪物方向攻击
   */
  private _attackMonster() {
    if (this.modelCtr.isIdle) {
      const monNode = this._searchMonster();
      if (monNode) {
        const canAttack = EnemyManager.Instance.canAttack(
          monNode.worldPosition,
          this.node.worldPosition,
          this._attackRadius,
        );

        if (canAttack) {
          this.rigidCtr.setRotate(
            monNode.worldPosition.clone().subtract(this.node.worldPosition).normalize(),
          );

          if (!this.rigidCtr.isRotating) {
            this._playAnim(Constant.PLAYER_ANI_TYPE.ATTACK, true)?.then(() => {
              this._attackCountDown = 2;
              this._playAnim(Constant.PLAYER_ANI_TYPE.IDLE);
            });
          }
        }
      }
    }
  }

  display() {
    this.node.active = true;
  }

  hide() {
    this.node.active = false;
  }

  // 获取当前释放的弓箭（添加特效后）
  private _getCurArrow() {
    const arrowList: Node[] = [];
    const arrowParent = this.node.parent;
    // double + continue 则需要特殊处理
    if (this.hasArrowDouble && this.hasArrowContinuous) {
      arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowDoubleContinuous", arrowParent));
    } else {
      if (this.hasArrowDouble) {
        arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowDouble", arrowParent));
      }

      if (this.hasArrowContinuous) {
        arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowSingleContinuous", arrowParent));
      }
    }

    if (this.hasArrowReverse) {
      arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowReverse", arrowParent));
    }

    if (this.hasArrowSide) {
      arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowSide", arrowParent));
    }

    if (this.hasArrowUmbrella) {
      arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowUmbrella", arrowParent));
    }

    // 没有double 和 continue 默认要使用单箭
    if (!this.hasArrowDouble && !this.hasArrowContinuous) {
      arrowList.push(PrefabManager.Instance.getPrefabNode("model", "arrowSingle", arrowParent));
    }

    return arrowList;
  }

  /**
   * 向敌人射箭
   *
   * @returns
   * @memberof Player
   */
  throwArrowToEnemy() {
    const arrowNodeList = this._getCurArrow();
    arrowNodeList.forEach(node => {
      node.setWorldPosition(this.node.getWorldPosition().add3f(0, 1.5, 0));
      node.eulerAngles = this.node.eulerAngles.clone();
      node.children.forEach(ai => {
        if (ai.name.startsWith("arrowItem")) {
          const arrowComp = ai.getComponent(Arrow) || ai.addComponent(Arrow);
          ai.getComponent(ColliderItemController) || ai.addComponent(ColliderItemController);

          arrowComp.init(this._throwArrowSpeed, this.node.getWorldPosition());
        }
      });
    });

    setTimeout(() => {
      arrowNodeList.forEach(node => {
        PoolManager.instance.putNode(node);
      });
    }, 1000);
  }

  goDie() {
    this._stopMove();
    AudioManager.Instance.playSound(Constant.SOUND.PLAYER_01_DIE);
    this._playAnim(Constant.PLAYER_ANI_TYPE.DIE);

    this._hp = 0;
    this._isDie = true;
    TimerManager.Instance.Once(() => {
      UIManager.Instance.display("RevivePanel");
    }, 2);
  }

  refreshBlood(num: number, isRefreshLimit?: boolean) {
    if(this.isDie){
      return;
    }

    if (num > 0) {
      AudioManager.Instance.playSound(Constant.SOUND.RECOVERY);
      EffectManager.Instance.playEffect("recovery", this.node);

      if (isRefreshLimit) {
        this.curHpLimit += num;
      }

      this._hp = Math.min(this._hp + num, this.curHpLimit);
      this._bloodUIInfo.controller.setup(this.node, this._bloodPos, this.curHpLimit, this._hp);
      return;
    }

    this._hp += num;
    this._bloodUIInfo.controller.refreshHP(num);
  }

  hurted(baseInfo: BaseInfoType) {
    if (this._isDie) {
      return;
    }

    let fightTipType = Constant.FIGHT_TIP.REDUCE_BLOOD;
    let damage = baseInfo.attackPower * (1 - this.curDefensePower / (this.curDefensePower + 400));
    // 躲避攻击
    if (Math.random() < this.curDodgeRate) {
      damage = 0;
    }

    // 暴击
    if (Math.random() < baseInfo.criticalHitRate) {
      damage *= baseInfo.criticalHitDamage;
      fightTipType = Constant.FIGHT_TIP.CRITICAL_HIT;
    }

    // 随机浮动 5% 伤害
    damage += damage * DataUtil.getRandom(-0.05, 0.05);
    damage = Math.ceil(-damage);

    if (damage) {
      AudioManager.Instance.playSound(Constant.SOUND.HIT_PLAYER);
    }

    FightTipManager.instance.displayDamageTip(this.node, v3(0, 50, 0), fightTipType, damage);
    this.refreshBlood(damage);

    if (this._hp <= 0) {
      this.goDie();
    }
  }

  revive() {
    GameApp.Instance.isGameStart = false;
    AudioManager.Instance.playSound(Constant.SOUND.REVIVE)
    this.resetPlayerState();
    this.refreshBlood(this.curHpLimit);
  }

  hideRunSmoke() {
    if (this._runSmokeEffectNode && this._runSmokeEffectNode.active) {
      this._runSmokeEffectNode.active = false;
    }
  }

  onEnable() {
    this.node.on(Constant.EVENT_TYPE.HP_EMPTY, this._onHPEmpty, this);
    this.node.on(Constant.EVENT_TYPE.HP_FULL, this._onHPFull, this);
  }

  onDisable() {
    this.node.off(Constant.EVENT_TYPE.HP_EMPTY, this._onHPEmpty, this);
    this.node.off(Constant.EVENT_TYPE.HP_FULL, this._onHPFull, this);
  }

  private _onHPEmpty() {}

  private _onHPFull() {}

  update(deltaTime: number) {
    if (this._canOperation()) {
      if (this._attackCountDown <= 0) {
        this._attackMonster();
      } else {
        this._attackCountDown--;
      }
    }
  }
}
