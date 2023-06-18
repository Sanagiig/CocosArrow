import { _decorator, Component, Node, SystemEvent, instantiate, Label } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { UIInfo, UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import { DataCenter } from "../../DataCenter/DataCenter";
import { SettingPanelController } from "./SettingPanelController";
import { GameApp } from "../../GameApp";
const { ccclass, property } = _decorator;

@ccclass("HomePanelController")
export class HomePanelController extends UIController {
  private _levelLabel: Label = null!;
  private _settingPanelUIInfo: UIInfo<SettingPanelController> = null;

  protected onLoad(): void {
    super.onLoad();
    this._levelLabel = this.node.getChildByPath("iconMap/levelNameBg/level").getComponent(Label);
    this.getViewNode("/BtnContainer/btnStart").on(
      SystemEvent.EventType.TOUCH_START,
      this._onStartBtnTouch,
      this,
    );
    this.getViewNode("/BtnContainer/btnToLevel1").on(SystemEvent.EventType.TOUCH_START, this._toLevel1, this);
    this.getViewNode("/BtnContainer/btnReset").on(SystemEvent.EventType.TOUCH_START, this._reset, this);
    this.getViewNode("/btnSetting").on(SystemEvent.EventType.TOUCH_START, this.onSettingBtnTouch, this);
  }

  display(): void {
    super.display();
    this._onPlayerDataUpdate();
  }

  hide(): void {
    if (this._settingPanelUIInfo) {
      this._settingPanelUIInfo.controller.hide();
    }
    super.hide();
  }

  private _onPlayerDataUpdate() {
    const playerData = DataCenter.Instance.getPlayerData();
    this._levelLabel.string = `${playerData.highestLevel}层`;
  }

  protected onEnable(): void {
    EventManager.Instance.on(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER, this._onPlayerDataUpdate, this);
  }

  protected onDisable(): void {
    EventManager.Instance.off(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER, this._onPlayerDataUpdate, this);
  }

  private _onStartBtnTouch() {
    const player = GameApp.Instance.player;
    this.hide();
    AudioManager.Instance.playSound(Constant.SOUND.START_GAME_CLICK);
    EventManager.Instance.emit(Constant.EVENT_TYPE.ON_GAME_INIT);
    if (player) {
      player.refreshBlood(player.curHpLimit);
    }
  }

  private _toLevel1() {
    const playerData = DataCenter.Instance.getPlayerData();
    playerData.level = 1;
    this._onStartBtnTouch();
  }

  private _reset() {
    const playerData = DataCenter.Instance.getPlayerData();
    const player = GameApp.Instance.player;
    playerData.level = 1;
    playerData.gold = 0;
    playerData.skillData.length = 0;
    
    if (player) {
      player.refreshSkill();
    }
    this._onStartBtnTouch();
  }

  onSettingBtnTouch() {
    if (!this._settingPanelUIInfo) {
      UIManager.Instance.loadUIViewByPath("Prefab", "ui/setting", "SettingPanel");
      this._settingPanelUIInfo = UIManager.Instance.getUIInfo(
        "SettingPanel",
      ) as UIInfo<SettingPanelController>;
    }

    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this._settingPanelUIInfo.controller.display();
  }
}
