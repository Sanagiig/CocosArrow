import { _decorator, Component, Node, Prefab, Enum, Camera, game, PhysicsSystem, profiler, view } from "cc";
import { GameApp } from "./Game/GameApp";
import { NetManager } from "./Framework/Managers/NetManager/NetManager";
import { ResManager } from "./Framework/Managers/ResManager/ResManager";
import { AudioManager } from "./Framework/Managers/AudioManager/AudioManager";
import { EventManager } from "./Framework/Managers/EventManager/EventManager";
import { TimerManager } from "./Framework/Managers/TimerManager/TimerManager";
import { UIManager } from "./Framework/Managers/UIManager/UIManager";
import { Constant } from "./Game/Base/Constant";
import { DataCenter } from "./Game/DataCenter/DataCenter";
import { FrameworkConfig } from "./Framework/FrameworkConfig";
import { EffectManager } from "./Game/Effect/EffectManager";
import ElectronAPI from "../ElectronAPI";

const { ccclass, property } = _decorator;

export enum GameNetMode {
  LOCAL,
  NET,
}

@ccclass("GameLaunch")
export class GameLaunch extends Component {
  public static Instance: GameLaunch;

  @property(Camera)
  public gameCamera: Node = null;

  @property(Prefab)
  public mainLoadingPrefab: Prefab = null;

  @property({ type: Enum(GameNetMode) })
  public netMode = GameNetMode.NET;

  protected onLoad(): void {
    if (!GameLaunch.Instance) {
      GameLaunch.Instance = this;
    } else {
      this.destroy();
      return;
    }

    this._initScreen();
    this.addComponent(ResManager);
    this.addComponent(EventManager);
    this.addComponent(TimerManager);
    this.addComponent(NetManager);
    this.addComponent(UIManager);
    this.addComponent(AudioManager);
    this.addComponent(EffectManager);
    this.addComponent(GameApp);
  }

  private _initScreen() {
    const size = view.getDesignResolutionSize();
    ElectronAPI.center();
    ElectronAPI.window();
    ElectronAPI.setSize(size.width, size.height);
    ElectronAPI.setResolution(size.width, size.height);
    console.log("size",size)

  }

  protected start(): void {
    const dc = DataCenter.Instance;
    const setting = dc.getSettingData();

    if (typeof setting.frameRate !== "number") {
      setting.frameRate = Constant.GAME_FRAME;
      //@ts-ignore
      if (window.wx && util.checkIsLowPhone()) {
        setting.frameRate = 30;
      }
    }

    game.setFrameRate(setting.frameRate);
    PhysicsSystem.instance.fixedTimeStep = 1 / setting.frameRate;

    //@ts-ignore
    if (window.cocosAnalytics) {
      //@ts-ignore
      window.cocosAnalytics.init({
        appID: "605630324", // 游戏ID
        version: "1.0.0", // 游戏/应用版本号
        storeID: "cocosPlay", // 分发渠道
        engine: "cocos", // 游戏引擎
      });
    }

    this._onDebug(setting.isDebugOpen);
    // 同步框架设置
    FrameworkConfig.Instance.set("isDebugOpen", setting.isDebugOpen);
  }

  _onDebug(isDebugOpen: boolean) {
    isDebugOpen ? profiler.showStats() : profiler.hideStats();
  }

  onEnable() {
    EventManager.Instance.on(Constant.EVENT_TYPE.SYS_DEBUG, this._onDebug, this);
  }

  onDisable() {
    EventManager.Instance.off(Constant.EVENT_TYPE.SYS_DEBUG, this._onDebug, this);
  }
}
