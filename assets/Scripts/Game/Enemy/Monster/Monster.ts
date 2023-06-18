import {
  _decorator,
  Component,
  Vec3,
  macro,
  Node,
  VideoClip,
  Quat,
  clamp,
  RigidBodyComponent,
  log,
  v3,
  Animation,
  AnimationState,
  find,
} from "cc";

import { MonsterModel } from "./MonsterModel";
import { Constant } from "../../Base/Constant";
import { PoolManager } from "../../../Framework/Managers/PoolManager/PoolManager";
import { GameApp } from "../../GameApp";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
import { UIInfo, UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { EffectManager, MonSkillEffectCtr } from "../../Effect/EffectManager";
import DataUtil from "../../../Framework/Utils/Shared/DataUtil";
import { EntityRigidController } from "../../Base/EntityRigidController";
import { MonsterBloodBarController } from "../../UIController/Fight/MonsterBloodBarController";
import { EnemyManager } from "../EnemyManager";
import NumberUtil from "../../../Framework/Utils/Shared/NumberUtil";
import { BaseInfoType, ModelInfoType, MonsterSkillInfo } from "../../DataCenter/DataType";
import { DataCenter } from "../../DataCenter/DataCenter";
import { Player } from "../../Player/Player";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import FightTipManager from "../../Fight/FightTipManager";
import { WarningController } from "../../WarningSkill/WarningType";
import { TimerManager } from "../../../Framework/Managers/TimerManager/TimerManager";
import { PrefabManager } from "../../Base/PrefabManager";

const { ccclass, property } = _decorator;
//普通怪物组件
@ccclass("Monster")
export class Monster extends Component {
  protected _isDie: boolean = false; //是否死亡
  protected _isAttacting: boolean = false;
  protected _hp: number = 100;
  protected _attackRadiusAdjust: number = 1; // 攻击距离修正(0 - 1)，近战的时候如果距离刚刚好很容易躲技能
  protected _searchRadius: number;
  protected _nearAttackRadius: number;
  protected _attackRadius: number;

  protected _attackPos: Vec3 = new Vec3(); //技能即将攻击的位置

  protected _autoHideBloodTimerID = 0;
  protected _hurtedTimerID: number = 0;
  protected _fireHurtedTimerID = 0;
  protected _iceHurtedTimerID = 0;
  protected _iceHurtedCount: number = 0; //冰冻伤害计数

  protected _skillNode: Node = null!; //技能特效节点
  protected _skillIndex: number = 0; //当前技能索引

  protected _curMoveSpeed: number = 0; //当前移动速度

  //移动相关
  protected _movePattern: number = 0; //移动模式
  protected _runSmokeEffectNode: Node = null!; //烟雾特效
  protected _bodyNode: Node = null!; //

  protected _moveDuration: number = 0;
  protected _moveFrequency: number = 0; //两次移动间隔,为0表示一直移动)
  protected _moveInterval: number = 0;
  protected _idleInterval: number = 0;

  protected _bloodCtr: MonsterBloodBarController = null!;
  protected _allSkillInfo: MonsterSkillInfo[] = []; //所有拥有的技能信息
  protected _skillInfo: MonsterSkillInfo = null!; // 当前skill 信息

  skillCtr: MonSkillEffectCtr = null!;
  modelCtr: MonsterModel = null!; //怪物动画组件播放脚本
  rigidCtr: EntityRigidController = null!;

  isMoving: boolean = false; //怪物是否正在移动
  bloodTipDirection: number = Constant.BLOOD_TIP_DIRECTION.LEFT_UP; //血量提示方向

  protected _warningCtr: WarningController = null!; //预警技能脚本

  baseInfo: BaseInfoType = null!; //怪物在base表里面对应数据
  modelInfo: ModelInfoType = null!; //怪物在当前层级的配置数据
  curAttackSpeed: number = 0; //当前攻击速度

  rigidComMonster: RigidBodyComponent = null!;

  protected get _isStopAttack() {
    //当前是否停止攻击,且原地跑
    return !this.isDie && !this.modelCtr.isIdle && !this.modelCtr.isAttacking && !this.modelCtr.isHitting;
  }

  set curMoveSpeed(v: number) {
    this._curMoveSpeed = v;
    this.rigidCtr.setSpeed(v);
  }

  get curMoveSpeed() {
    return this._curMoveSpeed;
  }

  set isDie(v: boolean) {
    if (v) {
      this.goDie();
    } else {
      this._isDie = v;
    }
  }

  get isRotating() {
    return this.rigidCtr.isRotating;
  }

  get isAttacting() {
    return this._isAttacting || this.modelCtr.isAttacking;
  }

  get isDie() {
    return this._isDie;
  }

  onEnable() {}

  onDisable() {}

  init(baseInfo: BaseInfoType, modelInfo: ModelInfoType) {
    this._initData(baseInfo, modelInfo);

    this.rigidComMonster.clearState();
    this._refreshSkill();
    this._playIdle();

    this._bloodCtr.hide();
    switch (this.node.name) {
      case "hellFire":
        this._bloodCtr.setup(this.node, v3(0, 180, 0), this._hp, this._hp);
        break;
      case "magician":
        this._bloodCtr.setup(this.node, v3(0, 100, 0), this._hp, this._hp);
        break;
      case "dragon":
        this._bloodCtr.setup(this.node, v3(0, 150, 0), this._hp, this._hp);
        break;
      default:
        this._bloodCtr.setup(this.node, v3(0, 80, 0), this._hp, this._hp);
    }
    console.log("Monster", this);
  }

  private _initData(baseInfo?: BaseInfoType, modelInfo?: ModelInfoType) {
    if (baseInfo) {
      this.baseInfo = this.getLevelDisBaseInfo(baseInfo);
    }

    if (modelInfo) {
      this.modelInfo = modelInfo;
    }

    this.rigidCtr = this.getComponent(EntityRigidController) || this.addComponent(EntityRigidController);
    if (!this.rigidComMonster) {
      this.rigidComMonster = this.node.getComponent(RigidBodyComponent) as RigidBodyComponent;
    }

    if (!this._bloodCtr) {
      const bloodNode = PrefabManager.Instance.getPrefabNode("ui", "MonsterBloodBar", find("/UICanvas"));
      this._bloodCtr =
        bloodNode.getComponent(MonsterBloodBarController) ||
        bloodNode.addComponent(MonsterBloodBarController);
    }

    this.isDie = false;
    this._isAttacting = false;
    this.isMoving = false;
    this._idleInterval = 0;
    this._moveInterval = 0;
    this._iceHurtedCount = 0;
    this._skillNode = null!;
    this._skillIndex = 0;

    this._hp = this.baseInfo.hp;
    this._searchRadius = this.baseInfo.searchRadius;
    this._nearAttackRadius = this.baseInfo.nearAttackRadius;
    this._attackRadius = this.baseInfo.attackRadius;

    this._moveDuration = this.baseInfo.moveDuration;
    this._moveFrequency = this.baseInfo.moveFrequency;

    this._movePattern = this.modelInfo.movePattern ? this.modelInfo.movePattern : this.baseInfo.movePattern;
    this.curAttackSpeed = this.baseInfo.attackSpeed;
    this.curMoveSpeed = this.baseInfo.moveSpeed;

    this.rigidCtr.clearState();
    this._bodyNode = this.node.getChildByName("body")!;
    this.modelCtr = this._bodyNode.getComponent(MonsterModel) || this._bodyNode.addComponent(MonsterModel);
    this.modelCtr.mosterCtr = this;
  }

  private _canAct() {
    return (
      !this._isDie &&
      GameApp.Instance.isGameStart &&
      !GameApp.Instance.isGameOver &&
      !GameApp.Instance.isGamePause
    );
  }

  /**
   * 刷新当前使用技能
   */
  protected _refreshSkill() {
    const skillIDList = this.modelInfo.skill === "" ? [] : this.modelInfo.skill.split("#");
    this._allSkillInfo.length = 0;

    skillIDList.forEach(id => {
      const skillInfo = DataCenter.Instance.csv.queryOneByID("monsterSkill", id);
      if (!skillInfo) {
        console.error("技能数据不存在", id);
        return;
      }

      this._allSkillInfo.push(skillInfo);
    });
  }

  goDie() {
    const dieSound = `${this.node.name}Die`;
    this._hp = 0;
    this._stopMove();

    AudioManager.Instance.playSound(dieSound);
    this._playAnim(Constant.MONSTER_ANI_TYPE.DIE, true)?.then(() => {
      this.showReward();
      PoolManager.instance.putNode(this.node);
    });
    this._isDie = true;
    this._recycleWaring();
    // 回收持续释放的技能
    if (this._skillInfo && this._skillInfo.skillDuration) {
      this._recycleSkill();
    }

    // 触发怪物死亡后事件
    TimerManager.Instance.Once(() => {
      this._bloodCtr.hide();

      if (Player.Instance.hasBloodthirsty) {
        Player.Instance.refreshBlood(20);
      }
    }, 0.5);
  }

  showReward() {
    EffectManager.Instance.genReward(this.baseInfo, this.node);
  }

  refreshBlood(num: number) {
    this._bloodCtr.refreshHP(num);
  }

  refreshAutoHideBlood() {
    if (this._autoHideBloodTimerID) {
      TimerManager.Instance.Unschedule(this._autoHideBloodTimerID);
    }

    this._bloodCtr.display();
    this._autoHideBloodTimerID = TimerManager.Instance.Once(() => {
      this._bloodCtr && this._bloodCtr.hide();
    }, 3);
  }

  private _playHurtedEffect() {
    let isHasFire = Player.Instance.hasArrowFire;
    let isHasIce = Player.Instance.hasArrowIce;
    let isHasLightning = Player.Instance.hasArrowLightning;
    let effectNameList = ["hit"];

    if (isHasFire) {
      effectNameList.push("hitFire");
      this._playFireHurted();
    }

    if (isHasIce) {
      effectNameList.push("hitIce");
      this._playIceHurted();
    }

    if (isHasLightning) {
      effectNameList.push("hitLightning");
      this._playLightningHurted();
    }

    if (effectNameList.length > 1) {
      effectNameList.shift();
    }

    effectNameList.forEach(en => {
      EffectManager.Instance.playEffect(en, this.node);
    });
  }

  private _playFireHurted() {
    if (this._fireHurtedTimerID) {
      TimerManager.Instance.Unschedule(this._fireHurtedTimerID);
    }

    this._fireHurtedTimerID = TimerManager.Instance.Schedule(
      () => {
        EffectManager.Instance.playEffect("hitFire", this.node);
        this.hurted(Player.Instance.curAttackPower * -0.2);
      },
      3,
      0.5,
      0.3,
    );
  }

  private _playIceHurted() {
    const maxIceHurted = 5;
    const maxSlowRatio = 0.5;
    const moveSpeed = this.curMoveSpeed;
    const attackSpeed = this.curAttackSpeed;

    if (this._iceHurtedCount < maxIceHurted) {
      this._iceHurtedCount++;
    }

    if (!this._iceHurtedTimerID) {
      this._iceHurtedTimerID = TimerManager.Instance.ScheduleAlways(
        () => {
          if (this._iceHurtedCount > 0) {
            this._iceHurtedCount--;
            EffectManager.Instance.playEffect("hitIce", this.node);
            this.curMoveSpeed = moveSpeed * (1 - (maxSlowRatio * this._iceHurtedCount) / maxIceHurted);
            this.curAttackSpeed = attackSpeed * (1 - (maxSlowRatio * this._iceHurtedCount) / maxIceHurted);
          } else {
            this.curMoveSpeed = moveSpeed;
            this.curAttackSpeed = attackSpeed;
            TimerManager.Instance.Unschedule(this._iceHurtedTimerID);
            this._iceHurtedTimerID = 0;
          }
        },
        null,
        0.5,
        0,
      );
    }
  }

  private _playLightningHurted() {
    const monsterList = EnemyManager.Instance.getAllNearMonster(this.node.getWorldPosition(), 8, this.node);
    monsterList.forEach(mons => {
      mons.getComponent(Monster).hurted(Player.Instance.curAttackPower * -0.2);
      EffectManager.Instance.showLightningChain(this.node, mons);
    });
  }

  private getLevelDisBaseInfo(baseInfo: BaseInfoType) {
    const info = Object.assign({}, baseInfo);
    const level = DataCenter.Instance.getPlayerItem("level");
    const ratio = level / 10 ;

    info.hp *= (1 +ratio) ;
    info.attackPower *= (1 + ratio / 8);
    info.criticalHitRate *= ratio;

    return info;
  }

  // 返回伤害值和受伤提示类型
  private _getDamage() {
    const player = Player.Instance;
    const monsterInfo = this.baseInfo;
    let fightTipType = Constant.FIGHT_TIP.REDUCE_BLOOD;
    let damage = player.curAttackPower * (1 - monsterInfo.defensePower / (monsterInfo.defensePower + 400));
    // 躲避攻击
    if (Math.random() < monsterInfo.dodgeRate) {
      damage = 0;
    }

    // 暴击
    if (Math.random() < player.curCriticalHitRate) {
      damage *= player.curCriticalHitDamage;
      fightTipType = Constant.FIGHT_TIP.CRITICAL_HIT;
    }

    // 随机浮动 5% 伤害
    damage += damage * DataUtil.getRandom(-0.05, 0.05);
    damage = Math.ceil(-damage);

    return { damage, fightTipType };
  }

  // 接收基础信息计算伤害，或者直接接收一个伤害值
  hurted(damageNum?: number) {
    if (this._isDie) {
      return;
    }

    const isDirectDamage = typeof damageNum == "number";
    let fightTipType = Constant.FIGHT_TIP.REDUCE_BLOOD;
    let damage = damageNum as number;

    if (!isDirectDamage) {
      const damageRes = this._getDamage();
      damage = damageRes.damage;
      fightTipType = damageRes.fightTipType;
    }

    damage = Math.round(damage);

    if (damage) {
      AudioManager.Instance.playSound(Constant.SOUND.HIT_MONSTER);

      // 直接伤害不需要播放特效 （防止重复触发属性效果）
      !isDirectDamage && this._playHurtedEffect();

      // 3秒不被攻击，隐藏血条
      this._hurtedTimerID && TimerManager.Instance.Unschedule(this._hurtedTimerID);
    }

    this._hp += damage;

    this.refreshAutoHideBlood();
    this.refreshBlood(damage);
    FightTipManager.instance.displayDamageTip(this.node, v3(0, 50, 0), fightTipType, damage);

    if (this._hp <= 0) {
      let dieSound = Constant.SOUND.AULA_DIE;

      switch (this.baseInfo.resName) {
        case "boomDragon":
          dieSound = Constant.SOUND.BOOM_DRAGON_DIE;
          break;
        case "magician":
          dieSound = Constant.SOUND.MAGICIAN_DIE;
          break;
        case "dragon":
          dieSound = Constant.SOUND.DRAGON_DIE;
          break;
        case "hellFire":
          dieSound = Constant.SOUND.HELL_FIRE_DIE;
          break;
        case "aula":
          dieSound = Constant.SOUND.AULA_DIE;
          break;
      }

      this.isDie = true;
      AudioManager.Instance.playSound(dieSound);
    }
  }

  private _canSeePlayer() {
    return EnemyManager.Instance.canSearchPlayer(this.node.worldPosition, this._searchRadius);
  }

  private _canAttackPlayer(adjustNum: number = this._attackRadiusAdjust) {
    let radius = this._attackRadius;
    if (!this._allSkillInfo.length) {
      radius = this._nearAttackRadius;
    }

    return EnemyManager.Instance.canSearchPlayer(this.node.worldPosition, radius * adjustNum);
  }

  private _getToPlayerVec() {
    return EnemyManager.Instance.getToPlayerVec(this.node.worldPosition);
  }

  private _moveToPlayer() {
    const pv = this._getToPlayerVec();
    this.rigidCtr.move(pv.x, pv.z);
  }

  private _moveToRandom() {
    const x = DataUtil.getRandomInt(-1, 1);
    const z = DataUtil.getRandomInt(-1, 1);
    this.rigidCtr.move(x, z);
  }

  private _rotateToPlayer() {
    if (this._canSeePlayer() && !this.isMoving && !this.isAttacting) {
      const pv = this._getToPlayerVec();
      this.rigidCtr.setRotate(pv);
    }
  }

  protected _move() {
    if (this._canSeePlayer() && this._movePattern !== Constant.MONSTER_MOVE_PATTERN.NO_MOVE) {
      this._moveToPlayer();
      this.isMoving = true;
    } else if (this._movePattern === Constant.MONSTER_MOVE_PATTERN.RANDOM) {
      this._moveToRandom();
      this.isMoving = true;
    }

    if (this.isMoving) {
      this._playAnim(Constant.MONSTER_ANI_TYPE.RUN);
    } else {
      this._playIdle();
    }
  }

  protected _stopMove() {
    this.isMoving = false;
    this.rigidCtr.stopMove();
  }

  protected _playAnim(aniName: string, hasThen: boolean = false) {
    if (!this._isDie) {
      return this.modelCtr.playAni(aniName, hasThen);
    }
  }

  protected _refreshAttackType() {
    let typeName = Constant.MONSTER_ANI_TYPE.ATTACK;
    // 地狱火有两个攻击状态，并且名字不一样
    if (this.baseInfo.resName === "hellFire") {
      if (!this._allSkillInfo.length) {
        typeName = Constant.MONSTER_ANI_TYPE.ATTACK_1;
      } else {
        typeName = Constant.MONSTER_ANI_TYPE.ATTACK_2;
      }
    }

    if (this._allSkillInfo.length) {
      this._skillIndex = DataUtil.getRandomInt(0, this._allSkillInfo.length);
      this._skillInfo = this._allSkillInfo[this._skillIndex];
    }

    return typeName;
  }

  protected _recycleWaring() {
    if (this._warningCtr) {
      this._warningCtr.recycle();
    }
  }

  protected _recycleSkill() {
    if (this.skillCtr) {
      this.skillCtr.recycle();
      this.skillCtr = null;
    }
  }

  protected _recycleBlood() {
    PoolManager.instance.putNode(this._bloodCtr.node);
    this._bloodCtr = null;
  }

  recycle() {
    this._recycleBlood();
    this._recycleWaring();
    this._recycleSkill();
  }

  // 根据技能生成warning
  protected _genWarning() {
    if (!this._skillInfo || !this._skillInfo.warning) {
      return;
    }

    const warningName = this._skillInfo.warning;
    const offsetV = v3();
    let scale = 1;

    Vec3.subtract(offsetV, this.node.worldPosition, Player.Instance.node.worldPosition);
    if (this._skillInfo.ID === Constant.MONSTER_SKILL.FIRE_BALL) {
      scale = 0.1;
    } else if (this._skillInfo.ID === Constant.MONSTER_SKILL.FIRE_BALL_BIG) {
      scale = 0.4;
    } else if (this._skillInfo.ID === Constant.MONSTER_SKILL.LASER) {
      scale = this.baseInfo.attackRadius;
    } else if (this._skillInfo.ID === Constant.MONSTER_SKILL.ENERGY_BALL) {
      scale = this.baseInfo.attackRadius;
    }

    this._warningCtr = EffectManager.Instance.genWarning(
      warningName,
      this.node.getWorldPosition(),
      this._attackPos.clone(),
      scale,
    );
  }

  protected _attackAction(attactType: string) {
    if (!this._canAct()) {
      return;
    }

    if (this._warningCtr) {
      this._warningCtr.hide();
    }

    this._isAttacting = true;
    // 攻击过后如果人物离开攻击范围，则需要重新等待IDLE 时间
    this._playAnim(attactType, true)?.then(() => {
      this._isAttacting = false;
      this._idleInterval = 0;
      this._playIdle();
    });
  }

  // 攻击检测，如果到了攻击范围则停止行动，进行攻击
  protected _attackCheck() {
    if (this._canAttackPlayer() && !this.isAttacting && !this.isRotating) {
      if (this.isMoving) {
        this._rotateToPlayer();
        return;
      }

      const attactType = this._refreshAttackType();
      this._attackPos.set(Player.Instance.node.worldPosition);
      this._genWarning();
      this._isAttacting = true;

      if (this._skillInfo) {
        // 如果有技能持续时间则不按照一个攻击结束释放技能
        if (this._skillInfo.skillDuration) {
          const attackState = this.modelCtr.animComp.getState(attactType);
          const defWrapMode = attackState.wrapMode;
          console.log("attactType", attactType);
          this._idleInterval = 0;
          // 临时修改持续攻击
          attackState.wrapMode = 2;
          this._playAnim(attactType);

          TimerManager.Instance.Once(() => {
            attackState.wrapMode = defWrapMode;
            this._isAttacting = false;
            this._playIdle();
            this._recycleSkill();
          }, this._skillInfo.skillDuration);
        } else {
          TimerManager.Instance.Once(() => {
            this._attackAction(attactType);
          }, this._skillInfo.warningDuration);
        }
      } else {
        this._attackAction(attactType);
      }
    }
  }

  protected _playIdle() {
    if (!this._isDie) {
      this._playAnim(Constant.MONSTER_ANI_TYPE.IDLE);
    }
  }
  /**
   * 向玩家释放技能
   *
   * @returns
   * @memberof Player
   */
  releaseSkillToPlayer() {
    // 普通攻击
    if (!this._skillInfo) {
      if (this._canAttackPlayer()) {
        Player.Instance.hurted(this.baseInfo);
      }
      return;
    }

    // 如果是持续性攻击，则需要等待 回收后才可释放技能
    if (this.skillCtr && this.skillCtr.node.parent && this._skillInfo.skillDuration && this.isAttacting) {
      return;
    }

    this.skillCtr = EffectManager.Instance.genEffect(
      this.baseInfo,
      this._skillInfo,
      this.node.getWorldPosition(),
      this._attackPos.clone(),
    );
  }

  private _updateMoveState(deltaTime: number) {
    if (this.isAttacting) {
      return;
    }

    if (this.isMoving) {
      this._moveInterval += deltaTime;
      if (this._moveInterval >= this._moveDuration) {
        this._idleInterval = 0;
        this._stopMove();
        this._playIdle();
      }
    } else {
      this._idleInterval += deltaTime;
      if (this._idleInterval >= this._moveFrequency) {
        this._moveInterval = 0;
        this._move();
      }
    }
  }

  update(deltaTime: number) {
    if (this._canAct()) {
      this._rotateToPlayer();
      this._attackCheck();
      this._updateMoveState(deltaTime);
    }
  }
}
