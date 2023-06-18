import { _decorator, Component, Label, Node, ProgressBar, view } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { DirectionCount, Joystick, JoystickConfig, StickMode } from "../../../Framework/Utils/Joystick";
import { Player } from "../../Player/Player";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { DataCenter } from "../../DataCenter/DataCenter";
import { GameApp } from "../../GameApp";
import { UIManager } from "../../../Framework/Managers/UIManager/UIManager";
const { ccclass, property } = _decorator;

@ccclass("FightPanelController")
export class FightPanelController extends UIController {
  private _joystick: Joystick;
  private _tipNode: Node;
  private _goldLabel: Label;
  private _levelLabel: Label;
  private _bossBloodBarNode: Node;
  private _isPause = false;
  private _debugClickCount = 0;
  private _canDebug = false;

  protected onLoad(): void {
    super.onLoad();
    this._initData();
    this._initComp();
    this._initEvent();
    console.log("FightPanel", this);
  }

  private _initComp() {
    this._tipNode = this.getViewNode("/joystick/tip");
    this._goldLabel = this.node.getChildByPath("memu/gold/num").getComponent(Label);
    this._levelLabel = this.node.getChildByPath("memu/level").getComponent(Label);
    this._bossBloodBarNode = this.node.getChildByPath("memu/bossBloodBar");
    this._bossBloodBarNode.getComponent(ProgressBar).progress = 1;
  }

  private _initData() {
    const visibleSize = view.getVisibleSize();
    const ringNode = this.getViewNode("/joystick/ring");
    const stickConfig: JoystickConfig = {
      ring: ringNode,
      dot: ringNode.getChildByName("dot"),
      radius: 100,
      minX: 0,
      maxX: visibleSize.width,
      minY: 0,
      maxY: visibleSize.height / 2,
      linker: {
        moveAction: d => {
          this._tipNode.active = false;

          if (!GameApp.Instance.isGameOver && !GameApp.Instance.isGamePause) {
            GameApp.Instance.isGameStart = true;
          }
          Player.Instance.moveAction(d);
        },
      },
    };

    this._joystick = this.addComponent(Joystick).init(stickConfig);
  }

  private _initEvent() {
    EventManager.Instance.on(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER, this._onPlayerDataUpdate, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.SHOW_BOSS_BLOOD_BAR, this._showBossBlood, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.HIDE_BOSS_BLOOD_BAR, this._hideBossBlood, this);
    this.getViewNode("/memu/level").on(Node.EventType.TOUCH_START, this._onLevelTouch, this);
    this.getViewNode("/memu/btnPause").on(Node.EventType.TOUCH_START, this._onStop, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.ON_GAME_INIT, this._onGameInit, this);
  }

  display(): void {
    super.display();
    this._onPlayerDataUpdate();
  }

  private _onGameInit() {
    this._debugClickCount = 0;
  }

  private _onStop() {
    UIManager.Instance.display("PausePanel");
  }

  private _showBossBlood() {
    this._bossBloodBarNode.active = true;
  }

  private _hideBossBlood() {
    this._bossBloodBarNode.active = false;
  }

  _onPlayerDataUpdate() {
    const playerData = DataCenter.Instance.getPlayerData();

    this._levelLabel.string = `第${playerData.level}层`;
    this._goldLabel.string = playerData.gold.toString();
  }

  private _onLevelTouch() {
    this._debugClickCount++;
    if (this._debugClickCount > 10) {
      this._canDebug = true;
    }

    if (this._canDebug) {
      EventManager.Instance.emit(Constant.EVENT_TYPE.SHOW_DEBUG_PANEL);
    }
  }

  protected onDestroy(): void {
    EventManager.Instance.off(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER, this._onPlayerDataUpdate, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.SHOW_BOSS_BLOOD_BAR, this._showBossBlood, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.HIDE_BOSS_BLOOD_BAR, this._hideBossBlood, this);
    this.getViewNode("/memu/level").off(Node.EventType.TOUCH_START, this._onLevelTouch, this);
    this.getViewNode("/memu/btnPause").off(Node.EventType.TOUCH_START, this._onStop, this);
  }
}
