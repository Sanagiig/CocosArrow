import {
  _decorator,
  Component,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  System,
  SystemEvent,
  instantiate,
} from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
import { DataCenter } from "../../DataCenter/DataCenter";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import { Constant } from "../../Base/Constant";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
const { ccclass, property } = _decorator;
@ccclass("SettingPanelController")
export class SettingPanelController extends UIController {
  private _closeBtnNode: Node;
  private _unCheckedSpriteFrame: SpriteFrame;
  private _checkedSpriteFrame: SpriteFrame;

  private _vibrationNode: Node;
  private _musicNode: Node;
  private _soundNode: Node;
  private _debugNode: Node;

  private _isVibrationOpen: boolean;
  private _isMusicOpen: boolean;
  private _isSoundOpen: boolean;
  private _isDebugOpen: boolean;

  protected onLoad(): void {
    super.onLoad();

    this._unCheckedSpriteFrame = ResManager.Instance.getAsset(
      "Texture",
      "setting/settingBlue/spriteFrame",
    ) as SpriteFrame;

    this._checkedSpriteFrame = ResManager.Instance.getAsset(
      "Texture",
      "setting/settingYellow/spriteFrame",
    ) as SpriteFrame;

    this._closeBtnNode = this.getViewNode("/container/btnClose");
    this._vibrationNode = this.getViewNode("/container/content/vibration/btnVibration");
    this._musicNode = this.getViewNode("/container/content/music/btnMusic");
    this._soundNode = this.getViewNode("/container/content/sound/btnSound");
    this._debugNode = this.getViewNode("/container/content/debug/btnDebug");

    this._syncData();
  }

  private _changeState(radioNode: Node, state: boolean) {
    const dotNode = radioNode.getChildByName("dot");
    const bgSprite = radioNode.getComponent(Sprite);
    const labelCom = radioNode.getChildByPath("dot/txt").getComponent(Label);
    const dotPos = dotNode.getPosition();
    const txt = state ? "开" : "关";
    const dotX = state ? 24 : -24;

    dotNode.setPosition(dotX, dotPos.y, dotPos.z);
    bgSprite.spriteFrame = state ? this._checkedSpriteFrame : this._unCheckedSpriteFrame;
    labelCom.string = txt;
  }

  private _updateUI() {
    this._changeState(this._vibrationNode, this._isVibrationOpen);
    this._changeState(this._musicNode, this._isMusicOpen);
    this._changeState(this._soundNode, this._isSoundOpen);
    this._changeState(this._debugNode, this._isDebugOpen);
  }

  private _syncData() {
    const settingData = DataCenter.Instance.getSettingData();
    this._isMusicOpen = settingData.isMusicOpen;
    this._isVibrationOpen = settingData.isVibrationOpen;
    this._isDebugOpen = settingData.isDebugOpen;
    this._isSoundOpen = settingData.isSoundOpen;
  }

  display(): void {
    this._syncData();
    this._updateUI();
    super.display();
  }

  hide(): void {
    super.hide();
  }

  protected onEnable(): void {
    this._closeBtnNode.on(SystemEvent.EventType.TOUCH_START, this._onCloseTouch, this);
    this._vibrationNode.on(SystemEvent.EventType.TOUCH_START, this._onVabrationTouch, this);
    this._musicNode.on(SystemEvent.EventType.TOUCH_START, this._onMusicTouch, this);
    this._soundNode.on(SystemEvent.EventType.TOUCH_START, this._onSoundTouch, this);
    this._debugNode.on(SystemEvent.EventType.TOUCH_START, this._onDebugTouch, this);
  }

  protected onDisable(): void {
    this._closeBtnNode.off(SystemEvent.EventType.TOUCH_START, this._onCloseTouch, this);
    this._vibrationNode.off(SystemEvent.EventType.TOUCH_START, this._onVabrationTouch, this);
    this._musicNode.off(SystemEvent.EventType.TOUCH_START, this._onMusicTouch, this);
    this._soundNode.off(SystemEvent.EventType.TOUCH_START, this._onSoundTouch, this);
    this._debugNode.off(SystemEvent.EventType.TOUCH_START, this._onDebugTouch, this);
  }

  //   同步数据，更新UI
  private _onVabrationTouch() {
    this._isVibrationOpen = !this._isVibrationOpen;
    DataCenter.Instance.updateSettingData({ isVibrationOpen: this._isVibrationOpen });
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this._changeState(this._vibrationNode, this._isVibrationOpen);
  }

  private _onMusicTouch() {
    this._isMusicOpen = !this._isMusicOpen;
    DataCenter.Instance.updateSettingData({ isMusicOpen: this._isMusicOpen });

    EventManager.Instance.emit(Constant.EVENT_TYPE.SYS_MUSIC_MUTE, !this._isMusicOpen);
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this._changeState(this._musicNode, this._isMusicOpen);
  }

  private _onSoundTouch() {
    this._isSoundOpen = !this._isSoundOpen;
    DataCenter.Instance.updateSettingData({ isSoundOpen: this._isSoundOpen });

    EventManager.Instance.emit(Constant.EVENT_TYPE.SYS_SOUND_MUTE, !this._isSoundOpen);
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this._changeState(this._soundNode, this._isSoundOpen);
  }

  private _onDebugTouch() {
    this._isDebugOpen = !this._isDebugOpen;

    DataCenter.Instance.updateSettingData({ isDebugOpen: this._isDebugOpen });
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    EventManager.Instance.emit(Constant.EVENT_TYPE.SYS_DEBUG, this._isDebugOpen);

    this._changeState(this._debugNode, this._isDebugOpen);
  }

  private _onCloseTouch() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this.hide();
  }
}
