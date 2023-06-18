import {
  _decorator,
  Component,
  Node,
  CameraComponent,
  Vec3,
  SkeletalAnimationComponent,
  ParticleSystemComponent,
  AnimationComponent,
  find,
  Prefab,
  Asset,
  Camera,
  AudioClip,
  game,
} from "cc";

import { EffectManager } from "./Effect/EffectManager";
// import { Monster } from "./monster";
import { GameCamera } from "./Camera/GameCamera";
import { EventManager } from "../Framework/Managers/EventManager/EventManager";
import { UIInfo, UIManager } from "../Framework/Managers/UIManager/UIManager";
import { AudioManager } from "../Framework/Managers/AudioManager/AudioManager";
import { ReqResInfo, ResManager } from "../Framework/Managers/ResManager/ResManager";
import { PoolManager } from "../Framework/Managers/PoolManager/PoolManager";
import { Constant } from "./Base/Constant";
import { MapManager } from "./Map/MapManager";
import { Player } from "./Player/Player";
import { GameLaunch } from "../GameLaunch";
import { Boss } from "./Enemy/Boss/Boss";
import { Monster } from "./Enemy/Monster/Monster";
import { DataCenter } from "./DataCenter/DataCenter";
import { Joystick } from "../Framework/Utils/Joystick";
import { EnemyManager } from "./Enemy/EnemyManager";
import { PrefabManager } from "./Base/PrefabManager";
import { TimerManager } from "../Framework/Managers/TimerManager/TimerManager";
const { ccclass, property } = _decorator;

@ccclass("GameApp")
export class GameApp extends Component {
  static Instance: GameApp;

  private _fightPanelInfo: UIInfo = null!;
  private _isWin = false;
  private _gameSpeed = 0;
  cameraNode: Node = null!; //相机组件
  map: MapManager = null!; //地图脚本组件
  ndLight: Node = null!; //主光源

  mapInfo: any = {}; //地图信息
  arrMonsterSkill: any[] = []; //已经预加载的敌人技能

  isGameStart: boolean = false; //游戏是否开始
  isGamePause: boolean = false; //游戏是否暂停
  isGameOver: boolean = false; //游戏是否结束
  player: Player = null!; //玩家脚本
  gameCamera: GameCamera; //相机脚本
  uiCanvasNode: Node;
  uiCameraNode: Node;
  playerNode: Node = null!; //玩家节点
  bossNode: Node = null!; //小怪节点
  boss: Boss = null!; //boss脚本
  effectNode: Node = null!; //特效节点
  mapNode: Node = null!; //地图节点
  isRevive: boolean = false; //玩家是否复活
  isTesting: boolean = true; //是否开启测试代码
  isFirstLoad: boolean = false; //是否首次加载
  arrMonster: Node[] = []; //小怪、boss数组
  existentNum: number = 0; //本层加载的npc、大爱心现存数量（怪物不会和npc、大爱心同时出现，配置表格需注意）
  //本层敌人加成
  attackAddition: number = 1; //本层敌人攻击加成
  defenseAddition: number = 1; //本层敌人防御加成
  hpAddition: number = 1; //本层敌人生命加成
  moveSpeedAddition: number = 1; //本层敌人移速加成
  attackSpeedAddition: number = 1; //本层敌人攻速加成

  set isWin(value: boolean) {
    this._isWin = value;

    if (this.isGameStart) {
      EventManager.Instance.emit(Constant.EVENT_TYPE.ON_GAME_OVER);
    }
  }

  get isWin() {
    return this._isWin;
  }

  set gameSpeed(value: number) {
    console.log("gameSpeed", this.gameSpeed);

    this._gameSpeed = value;
    this.refreshEffectSpeed(this.playerNode as Node, this._gameSpeed);
    this.refreshEffectSpeed(this.effectNode as Node, this._gameSpeed);
  }

  get gameSpeed() {
    return this._gameSpeed;
  }

  private _loadingPanelInfo: UIInfo = null!;

  private _oriMainLightWorPos: Vec3 = null!; //主光源节点初始世界坐标
  private _offsetWorPosMainLight: Vec3 = new Vec3(); //主光源和玩家的向量差

  private static _gameSpeed: number = 1; //游戏速度
  private static _isWin: boolean = false; //是否取得胜利

  protected onLoad(): void {
    if (!GameApp.Instance) {
      GameApp.Instance = this;
    } else {
      this.destroy();
      console.error("GameApp was loaded");
      return;
    }

    this.addComponent(EnemyManager);
    this.cameraNode = find("MainCamera");
    this.uiCanvasNode = find("UICanvas");
    this.uiCameraNode = find("UICanvas/Camera");
    this.gameCamera = this.cameraNode.getComponent(GameCamera);
    this.mapNode = find("Game/Map") as Node;
    this.effectNode = find("Game/Effect") as Node;

    this.map = this.mapNode.addComponent(MapManager);
    this.enterGameLoading();
    console.log("GameApp", this);
  }

  private _setupDebugUtils() {
    if (DataCenter.Instance.getSettingItem("isDebugOpen")) {
      //@ts-ignore
      window.UIManager = UIManager.Instance;
      //@ts-ignore
      window.AudioManager = AudioManager.Instance;
      //@ts-ignore
      window.EventManager = EventManager.Instance;
      //@ts-ignore
      window.GameApp = this;
      //@ts-ignore
      window.DataCenter = DataCenter.Instance
      //@ts-ignore
      window.Player = Player;
      //@ts-ignore
      window.Enemy = EnemyManager.Instance;
      //@ts-ignore
      window.mapNode = this.mapNode;
      //@ts-ignore
      window.EffectManager = EffectManager.instance;
      //@ts-ignore
      window.effectNode = this.effectNode;
      //@ts-ignore
      window.Constant = Constant;
      //@ts-ignore
      window.TimerManager = TimerManager.Instance;
      //@ts-ignore
    }
  }

  /**
   * 初始化游戏l
   */
  private _onGameInit() {
    this._refreshMapInfo();
    this._initData();
    this._refreshLevel();

    UIManager.Instance.hide("FightPanel");
    this._loadingPanelInfo.controller.display();
    TimerManager.Instance.Once(() => {
      UIManager.Instance.display("FightPanel");
    }, 2);
  }

  private _initData() {
    this.isGameStart = false;
    this.isGamePause = false;
    this.isGameOver = false;
    this.isWin = false;
    this.isRevive = false;
    this.arrMonster = [];
    this.gameSpeed = 1;
    this.bossNode = null!;
    this.existentNum = 0;

    //设置本层敌人属性加成比例
    this.attackAddition = this.mapInfo.attackAddition;
    this.defenseAddition = this.mapInfo.defenseAddition;
    this.hpAddition = this.mapInfo.hpAddition;
    this.moveSpeedAddition = this.mapInfo.moveSpeedAddition;
    this.attackSpeedAddition = this.mapInfo.attackSpeedAddition;
  }

  private _initAudio() {
    const clips = ResManager.Instance.getAssets("Audio", "/") as AudioClip[];
    AudioManager.Instance.syncSetting();
    clips.forEach(clip => {
      AudioManager.Instance.setupSoud(clip.name, clip);
    });
  }

  private _refreshMapInfo() {
    const csv = DataCenter.Instance.csv;
    const totalLevel = csv.getTable("checkpoint").length;
    let level = DataCenter.Instance.getPlayerItem("level");

    //游戏通关后从倒数第10关开始循环(61-70)
    if (level > totalLevel) {
      level = totalLevel - 10 + ((level - totalLevel) % 10);
    }

    this.mapInfo = csv.queryOneByID("checkpoint", String(level));
  }

  /**
   * 刷新关卡, 后期优化写法。。。
   */
  private _refreshLevel() {
    //每层随机一张地图
    let arrMap = this.mapInfo.mapName.split("#");
    let mapName = arrMap[Math.floor(Math.random() * arrMap.length)];

    if (!this.player) {
      this._initPlayer();
    } else {
      this.player.display();
      this.player.resetPlayerState();
    }

    if (!this._fightPanelInfo) {
      this._fightPanelInfo = UIManager.Instance.loadUIViewByPath("Prefab", "ui/fight", "FightPanel");
    }

    this._loadMap(mapName);
    this._loadingPanelInfo.controller.hide();
    this._fightPanelInfo.controller.display();
  }

  // 加载地图数据
  private _loadMap(mapName: string) {
    this.map.display();
    this.map.buildMap(mapName);
  }

  /**
   * 创建玩家
   *
   * @private
   * @memberof GameApp
   */
  private _initPlayer() {
    const pf = ResManager.Instance.getAsset("Prefab", "/model/player/player01") as Prefab;
    this.playerNode = PoolManager.instance.getNode(pf, this.node) as Node;

    this.gameCamera.followTargetNode = this.playerNode;

    this.node.addChild(this.playerNode);
    this.player = this.playerNode.addComponent(Player);

    EventManager.Instance.emit(Constant.EVENT_TYPE.HIDE_LOADING_PANEL);
  }

  /**
   * 游戏暂停
   */
  private _onGamePause() {
    this.isGamePause = true;
    game.pause();
  }

  /**
   * 游戏恢复
   */
  private _onGameResume() {
    this.isGamePause = false;
    game.resume();
  }

  /**
   * 获取距离最近的小怪、boss节点
   * @returns
   */
  getNearestMonster() {}

  /**
   * 获取除了怪物本身自己外一定范围内的怪物
   *
   * @static
   * @param {Node} ndMonster 被击中的敌人
   * @param {boolean} [isAll=false] 是否返回全部敌人,否则只随机返回一个
   * @param {number} [range=5] 范围
   * @return {*}
   * @memberof GameApp
   */
  getNearbyMonster(ndMonster: Node, isAll: boolean = false, range: number = 5) {}

  /**
   * 刷新自节点的动画、粒子播放速度
   * @param targetNode
   * @param value
   * @returns
   */
  refreshEffectSpeed(targetNode: Node, value: number) {
    if (!targetNode) {
      return;
    }
    let arrAni = targetNode.getComponentsInChildren(AnimationComponent);
    arrAni.forEach((item: AnimationComponent) => {
      item.clips.forEach((clip: any) => {
        let aniName = clip?.name as string;
        let aniState = item.getState(aniName);
        aniState.speed = value;
      });
    });

    let arrSkeletalAni = targetNode.getComponentsInChildren(SkeletalAnimationComponent);
    arrSkeletalAni.forEach((item: SkeletalAnimationComponent) => {
      item.clips.forEach((clip: any) => {
        let aniName = clip?.name as string;
        let aniState = item.getState(aniName);
        aniState.speed = value;
      });
    });

    let arrParticle = targetNode.getComponentsInChildren(ParticleSystemComponent);
    arrParticle.forEach((item: ParticleSystemComponent) => {
      item.simulationSpeed = value;
    });
  }

  enterGameLoading() {
    const resPkgInfo: ReqResInfo<Asset> = {
      Audio: Asset,
      Datas: Asset,
      Prefab: Prefab,
      Texture: Asset,
    };

    UIManager.Instance.setupUI("MainLoadingUI", GameLaunch.Instance.mainLoadingPrefab);
    ResManager.Instance.preloadResPkg(
      resPkgInfo,
      this._onMainLoadProgress.bind(this),
      this._onMainLoadCompleted.bind(this),
    );
  }

  recycle() {
    this.isGameStart = false;
    MapManager.Instance.recycle();
    MapManager.Instance.hide();
    this.player.hide();
  }

  private _onMainLoadProgress(cur, total) {
    EventManager.Instance.emit(Constant.EVENT_TYPE.UI_MAIN_LOADING_PROGRESS, cur, total);
  }

  private _onMainLoadCompleted() {
    this._loadingPanelInfo = UIManager.Instance.loadUIViewByPath("Prefab", "ui/loading", "LoadingPanel");
    DataCenter.Instance.loadGameConfig();

    UIManager.Instance.loadUIViewByPath("Prefab", "ui/debug", "DebugPanel");
    UIManager.Instance.loadUIViewByPath("Prefab", "ui/home", "HomePanel");
    UIManager.Instance.loadUIViewByPath("Prefab", "ui/revive", "RevivePanel");
    UIManager.Instance.loadUIViewByPath("Prefab", "ui/pause", "PausePanel");
    UIManager.Instance.loadUIViewByPath("Prefab", "ui/skill", "SkillPanel");
    UIManager.Instance.loadUIViewByPath("Prefab", "ui/shop", "ShopPanel");


    UIManager.Instance.hide("DebugPanel");
    UIManager.Instance.hide("MainLoadingUI");
    UIManager.Instance.hide("RevivePanel");
    UIManager.Instance.hide("PausePanel");
    UIManager.Instance.hide("SkillPanel");
    UIManager.Instance.hide("ShopPanel");
    UIManager.Instance.display("HomePanel");
    PrefabManager.Instance.init();

    this._initAudio();
    this._setupDebugUtils();
  }

  private _onMusicMute(is: boolean) {
    AudioManager.Instance.setMusicMute(is);
  }

  private _onSoundMute(is: boolean) {
    AudioManager.Instance.setSoundMute(is);
  }

  onEnable() {
    EventManager.Instance.on(Constant.EVENT_TYPE.SYS_MUSIC_MUTE, this._onMusicMute, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.SYS_SOUND_MUTE, this._onSoundMute, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.ON_GAME_INIT, this._onGameInit, this);

    EventManager.Instance.on(Constant.EVENT_TYPE.GAME_PAUSE, this._onGamePause, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.GAME_RESUME, this._onGameResume, this);
  }

  onDisable() {
    EventManager.Instance.off(Constant.EVENT_TYPE.SYS_MUSIC_MUTE, this._onMusicMute, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.SYS_SOUND_MUTE, this._onSoundMute, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.ON_GAME_INIT, this._onGameInit, this);

    EventManager.Instance.off(Constant.EVENT_TYPE.ON_GAME_PAUSE, this._onGamePause, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.GAME_RESUME, this._onGameResume, this);
  }

  update(deltaTime: number) {
    //光源跟随玩家人物移动
    if (this.player && this.player.node && !this.isGameOver) {
      // Vec3.subtract(this._offsetWorPosMainLight, this.playerNode.worldPosition, this._oriMainLightWorPos);
      // this._offsetWorPosMainLight.set(this._offsetWorPosMainLight.x, 0, this._offsetWorPosMainLight.z);
      // this.ndLight.setWorldPosition(this._offsetWorPosMainLight.add(this._oriMainLightWorPos));
    }
  }
}
