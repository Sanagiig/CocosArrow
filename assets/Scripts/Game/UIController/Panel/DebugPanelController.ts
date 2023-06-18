import {
  _decorator,
  Button,
  Color,
  Component,
  EventTouch,
  game,
  instantiate,
  Label,
  Node,
  Prefab,
  ProgressBar,
  Sprite,
  UITransform,
  view,
} from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { DirectionCount, Joystick, JoystickConfig, StickMode } from "../../../Framework/Utils/Joystick";
import { Player } from "../../Player/Player";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { DataCenter } from "../../DataCenter/DataCenter";
import { GameApp } from "../../GameApp";
import { PlayerSkillInfo } from "../../DataCenter/DataType";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
import ArrayUtil from "../../../Framework/Utils/Shared/ArrayUtil";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import Storage from "../../../Framework/Utils/Storage";

const { ccclass, property } = _decorator;

class BtnCtr extends Component {
  private _isActive = false;
  private _defBgColor = new Color().fromHEX("#ffffff");
  private _selBgColor = new Color().fromHEX("#57eec4");
  private _data: any;

  setActive(v: boolean) {
    this._updateState(v, false);
  }

  bindData(v: any) {
    this._data = v;
  }

  private _toggle(event: EventTouch, v?: boolean) {
    if (typeof v == "boolean") {
      this._updateState(v);
      return;
    }

    this._updateState(!this._isActive);
  }

  private _updateState(v: boolean, emit: boolean = true) {
    const color = v ? this._selBgColor : this._defBgColor;
    this._isActive = v;
    this.node.getComponent(Sprite).color = color;
    if (emit) {
      this.node.emit("onSelected", v, this._data);
    }
  }

  protected onEnable(): void {
    this.node.on(Node.EventType.TOUCH_START, this._toggle, this);
  }
  protected onDisable(): void {
    this.node.on(Node.EventType.TOUCH_START, this._toggle, this);
  }
}

@ccclass("DebugPanelController")
export class DebugPanelController extends UIController {
  private _levelContentNode: Node;
  private _skillContentNode: Node;
  private _clearStorageBtn: Node;
  private _frame30Btn: Node;
  private _frame60Btn: Node;
  private _clearAllSkilBtn: Node;
  private _ownAllSkillBtn: Node;
  private _goDieBtn: Node;

  private _allSkillData: PlayerSkillInfo[] = [];
  private _selSkill: PlayerSkillInfo[] = [];

  protected onLoad(): void {
    super.onLoad();
    this._initData();
    this._initEvent();
    console.log("DebugPanelController", this);
  }

  private _initData() {
    this._allSkillData = DataCenter.Instance.csv.getTable("playerSkill").queryAll();
    this._levelContentNode = this.getViewNode("/commonRectangle/levelScrollView/view/content");
    this._skillContentNode = this.getViewNode("/commonRectangle/playerSkillScrollView/view/content");

    this._clearStorageBtn = this.getViewNode("/commonRectangle/menu/btnClearStorage");
    this._frame30Btn = this.getViewNode("/commonRectangle/menu/btnFrame30");
    this._frame60Btn = this.getViewNode("/commonRectangle/menu/btnFrame60");
    this._clearAllSkilBtn = this.getViewNode("/commonRectangle/menu/btnClearPlayerSkill");
    this._ownAllSkillBtn = this.getViewNode("/commonRectangle/menu/btnSelectAllPlayerSkill");
    this._goDieBtn = this.getViewNode("/commonRectangle/menu/goDieBtn");
  }

  private _initEvent() {
    EventManager.Instance.on(Constant.EVENT_TYPE.SHOW_DEBUG_PANEL, this.display, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.HIDE_DEBUG_PANEL, this.hide, this);
    this.getViewNode("/commonRectangle/btnClose").on(Node.EventType.TOUCH_START, this.hide, this);

    this._clearStorageBtn.on(Node.EventType.TOUCH_START, this._onClearStorage, this);
    this._frame30Btn.on(Node.EventType.TOUCH_START, this._onFrame30, this);
    this._frame60Btn.on(Node.EventType.TOUCH_START, this._onFrame60, this);
    this._clearAllSkilBtn.on(Node.EventType.TOUCH_START, this._onClearAllSkill, this);
    this._ownAllSkillBtn.on(Node.EventType.TOUCH_START, this._onOwnAllSkill, this);
    this._goDieBtn.on(Node.EventType.TOUCH_START, this._onGoDie, this);
  }

  private _initLvelBtn() {
    const maxLevel = 70;
    const mod = ResManager.Instance.getAsset("Prefab", "/ui/debug/debugLevelItem") as Prefab;
    const curLevel = DataCenter.Instance.getPlayerItem("level");

    let i = 0;
    while (i++ < maxLevel) {
      const isActive = i === curLevel;
      let child = this._levelContentNode.children[i - 1];
      if (!child) {
        child = instantiate(mod);
        child.parent = this._levelContentNode;
      }

      const ctr = child.getComponent(BtnCtr) || child.addComponent(BtnCtr);
      ctr.bindData(i);
      ctr.setActive(isActive);
      child.on("onSelected", this._onLevelSelected, this);
      child.getChildByName("txt").getComponent(Label).string = String(i);
    }
  }

  private _initSkillBtn() {
    const skillData = DataCenter.Instance.getPlayerData().skillData;
    const maxSkill = this._allSkillData.length;
    const mod = ResManager.Instance.getAsset("Prefab", "/ui/debug/debugSkillItem") as Prefab;
    let i = 0;

    while (i++ < maxSkill) {
      const skillInfo = this._allSkillData[i - 1];
      const isActive = skillData.indexOf(skillInfo.ID) !== -1;
      let child = this._skillContentNode.children[i - 1];
      if (!child) {
        child = instantiate(mod);
        child.active = false;
        child.active = true;
        child.parent = this._skillContentNode;
      }

      const ctr = child.getComponent(BtnCtr) || child.addComponent(BtnCtr);
      ctr.bindData(skillInfo);
      ctr.setActive(isActive);
      child.on("onSelected", this._onSkillSelected, this);
      child.getChildByName("txt").getComponent(Label).string = skillInfo.name;
    }
  }

  display(): void {
    this.node.setSiblingIndex(100);
    this._initLvelBtn();
    this._initSkillBtn();
    super.display();
  }

  hide(): void {
    super.hide();
  }

  private _onLevelSelected(isSelected: boolean, level: number) {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);

    if (isSelected) {
      const playerData = DataCenter.Instance.getPlayerData();
      playerData.level = level;
      EventManager.Instance.emit(Constant.EVENT_TYPE.ON_GAME_INIT);

      this.hide();
    }
  }

  private _onSkillSelected(isSelected: boolean, skillInfo: PlayerSkillInfo) {
    const playerSkill = DataCenter.Instance.getPlayerData().skillData;

    AudioManager.Instance.playSound(Constant.SOUND.CLICK);

    if (!isSelected) {
      ArrayUtil.removeItem(playerSkill, skillInfo.ID);
    } else {
      if (skillInfo.ID === Constant.PLAYER_SKILL.RECOVERY) {
        Player.Instance.refreshBlood(Player.Instance.curHpLimit);
        return;
      }
      playerSkill.push(skillInfo.ID);
    }

    Player.Instance.refreshSkill();
  }

  private _onClearStorage() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    Storage.Instance.clear();
  }

  private _onFrame30() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    game.setFrameRate(30);
  }

  private _onFrame60() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    game.setFrameRate(60);
  }

  private _onClearAllSkill() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
  }

  private _onOwnAllSkill() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
  }

  private _onGoDie() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this.hide();
    Player.Instance.goDie();
  }

  protected onDestroy(): void {
    EventManager.Instance.off(Constant.EVENT_TYPE.SHOW_DEBUG_PANEL, this.display, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.HIDE_DEBUG_PANEL, this.hide, this);
    this.getViewNode("/commonRectangle/btnClose").off(Node.EventType.TOUCH_START, this.hide, this);

    this._clearStorageBtn.off(Node.EventType.TOUCH_START, this._onClearStorage, this);
    this._frame30Btn.off(Node.EventType.TOUCH_START, this._onFrame30, this);
    this._frame60Btn.off(Node.EventType.TOUCH_START, this._onFrame60, this);
    this._clearAllSkilBtn.off(Node.EventType.TOUCH_START, this._onClearAllSkill, this);
    this._ownAllSkillBtn.off(Node.EventType.TOUCH_START, this._onOwnAllSkill, this);
    this._goDieBtn.off(Node.EventType.TOUCH_START, this._onGoDie, this);
  }
}
