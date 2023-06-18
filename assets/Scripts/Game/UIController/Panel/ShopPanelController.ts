import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { DataCenter } from "../../DataCenter/DataCenter";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import TipBarManager from "../common/TipManager";
import { PlayerSkillInfo } from "../../DataCenter/DataType";
import DataUtil from "../../../Framework/Utils/Shared/DataUtil";
import { PrefabManager } from "../../Base/PrefabManager";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
import { Player } from "../../Player/Player";
const { ccclass, property } = _decorator;

@ccclass("ShopPanelController")
export class ShopPanelController extends UIController {
  private _skillListNode: Node;
  private _closeNode: Node;
  private _allSkillData: PlayerSkillInfo[] = [];
  private _curSkillData: PlayerSkillInfo[] = [];

  protected onLoad(): void {
    super.onLoad();
    this._initData();
  }

  private _initData() {
    this._allSkillData = DataCenter.Instance.csv.getTable("playerSkill").queryAll();
    this._skillListNode = this.getViewNode("/container/skills");
    this._closeNode = this.getViewNode("/container/btnClose");
  }

  private _setupSkill(skillInfo: PlayerSkillInfo, idx: number) {
    const skillItem = this._skillListNode.children[idx];
    const icon = ResManager.Instance.getAsset(
      "Texture",
      `/skillIcon/${skillInfo.icon}/spriteFrame`,
    ) as SpriteFrame;

    skillItem.getChildByName("iconSkill").getComponent(Sprite).spriteFrame = icon;
    skillItem.getChildByName("name").getComponent(Label).string = skillInfo.name;
    skillItem.getChildByName("desc").getComponent(Label).string = skillInfo.desc;
    skillItem.getChildByPath("bg/lbGold").getComponent(Label).string = skillInfo.price.toString();
    skillItem.active = true;
  }

  private _setupSkillList() {
    const all = this._allSkillData;
    const sel = DataCenter.Instance.getPlayerData().skillData;
    const curSkillList = [] as PlayerSkillInfo[];

    while (curSkillList.length < 3) {
      const skillIdx = DataUtil.getRandomInt(0, all.length - 1);
      const skillInfo = all[skillIdx];

      //   只生成BUFF 或者没拥有的技能
      if (skillInfo.ID.startsWith("2") || sel.indexOf(skillInfo.ID) === -1) {
        if (curSkillList.indexOf(skillInfo) === -1) {
          curSkillList.push(skillInfo);
        }
      }
    }

    curSkillList.forEach((s, i) => {
      this._setupSkill(s, i);
    });

    this._curSkillData = curSkillList;
  }

  display(): void {
    super.display();
    this.node.setSiblingIndex(100);
    this._setupSkillList();
  }

  hide(): void {
    super.hide();
  }

  private _onSelSkill(idx: number) {
    const playerData = DataCenter.Instance.getPlayerData();
    const playerSkillData = playerData.skillData;
    const skillInfo = this._curSkillData[idx];

    if (playerData.gold < skillInfo.price) {
      TipBarManager.Instance.tip("小伙子，你身上的钱不够，等你发达了再来吧 !");
      return;
    }

    playerData.gold -= skillInfo.price;
    if (skillInfo.ID === Constant.PLAYER_SKILL.RECOVERY) {
      Player.Instance.refreshBlood(Player.Instance.curHpLimit);
    }else{
        playerSkillData.push(skillInfo.ID);
        Player.Instance.refreshSkill();
    }

    this._skillListNode.children[idx].active = false;
    AudioManager.Instance.playSound(Constant.SOUND.SELL);
    AudioManager.Instance.playSound(Constant.SOUND.GOLD_DROP);
    EventManager.Instance.emit(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER);
  }

  protected onEnable(): void {
    this._closeNode.on(Node.EventType.TOUCH_START, this.hide, this);
    this._skillListNode.children[0].on(Node.EventType.TOUCH_START, () => {
      this._onSelSkill(0);
    });

    this._skillListNode.children[1].on(Node.EventType.TOUCH_START, () => {
      this._onSelSkill(1);
    });

    this._skillListNode.children[2].on(Node.EventType.TOUCH_START, () => {
      this._onSelSkill(2);
    });
  }

  protected onDisable(): void {
    this._closeNode.off(Node.EventType.TOUCH_START, this.hide, this);
    this._skillListNode.children[0].off(Node.EventType.TOUCH_START);
    this._skillListNode.children[1].off(Node.EventType.TOUCH_START);
    this._skillListNode.children[2].off(Node.EventType.TOUCH_START);
  }
}
