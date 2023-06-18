import { _decorator, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { GameApp } from "../../GameApp";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { DataCenter } from "../../DataCenter/DataCenter";
import { PrefabManager } from "../../Base/PrefabManager";
import { PlayerSkillInfo } from "../../DataCenter/DataType";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
import { UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
import { TimerManager } from "../../../Framework/Managers/TimerManager/TimerManager";
const { ccclass, property } = _decorator;

@ccclass("PausePanelController")
export class PausePanelController extends UIController {
  private _closeBtnNode: Node;
  private _homeBtnNode: Node;
  private _resumeBtnNode: Node;
  private _skillContentNode: Node;
  private _skillDetailNode: Node;
  private _allSkillInfo: PlayerSkillInfo[] = [];
  protected onLoad(): void {
    super.onLoad();
    this._initData();
  }

  private _initData() {
    this._closeBtnNode = this.getViewNode("/btnClose");
    this._homeBtnNode = this.getViewNode("/container/menu/btnHome");
    this._resumeBtnNode = this.getViewNode("/container/menu/btnPlay");
    this._skillContentNode = this.getViewNode("/container/SkillScrollView/view/content");
    this._skillDetailNode = this.getViewNode("/container/skillItem");
  }

  private _setupCurSkill() {
    const skillData = DataCenter.Instance.getPlayerData().skillData.slice().sort();
    let usedSkillItemCount = 0;

    this._allSkillInfo = DataCenter.Instance.csv.getTable("playerSkill").queryAll();
    this._skillDetailNode.active = false;
    skillData.forEach((id, idx) => {
      const skillInfo = this._allSkillInfo.find(item => item.ID === id);
      if (!skillInfo) {
        console.error("id not exist in", this._allSkillInfo);
        return;
      }

      let node = this._skillContentNode.children[idx];
      if (!node) {
        node = PrefabManager.Instance.getPrefabNode("ui", "skillIcon", this._skillContentNode);
        node.on(Node.EventType.TOUCH_START, () => {
          this._selSkill(node, id);
        });
      }

      usedSkillItemCount++;
      node.active = true;
      node.getChildByName("icon").getComponent(Sprite).spriteFrame = ResManager.Instance.getAsset(
        "Texture",
        `/skillIcon/${skillInfo.icon}/spriteFrame`,
      ) as SpriteFrame;

      console.log("spri", node.getChildByName("icon").getComponent(Sprite).spriteFrame);
    });

    // 默认显示第一个技能详情
    if (skillData.length) {
      this._skillDetailNode.active = true;
      this._selSkill(this._skillContentNode.children[0], skillData[0]);
    }

    // 将没用到的ICON 隐藏
    if (usedSkillItemCount < this._skillContentNode.children.length) {
      for (let i = usedSkillItemCount; i < this._skillContentNode.children.length; i++) {
        this._skillContentNode.children[i].active = false;
      }
    }
  }

  private _selSkill(skillNode: Node, id: string) {
    const skillInfo = this._allSkillInfo.find(item => item.ID === id);
    const iconNode = this._skillDetailNode.getChildByPath("iconBg/icon");
    const nameLabel = this._skillDetailNode.getChildByName("name").getComponent(Label);
    const descLabel = this._skillDetailNode.getChildByName("desc").getComponent(Label);

    AudioManager.Instance.playSound(Constant.SOUND.CLICK);

    nameLabel.string = skillInfo.name;
    descLabel.string = skillInfo.desc;
    iconNode.getComponent(Sprite).spriteFrame = skillNode
      .getChildByName("icon")
      .getComponent(Sprite).spriteFrame;
  }

  display(): void {
    EventManager.Instance.emit(Constant.EVENT_TYPE.GAME_PAUSE);
    this.node.setSiblingIndex(100);
    super.display();
    this._setupCurSkill();
  }

  hide(): void {
    EventManager.Instance.emit(Constant.EVENT_TYPE.GAME_RESUME);
    super.hide();
  }

  private _toHome() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    GameApp.Instance.recycle();
    UIManager.Instance.hideAll();
    TimerManager.Instance.Once(() => {
      UIManager.Instance.display("HomePanel");
    }, 0.1);
  }

  private _onClose() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this.hide();
  }

  protected onEnable(): void {
    this._closeBtnNode.on(Node.EventType.TOUCH_START, this._onClose, this);
    this._homeBtnNode.on(Node.EventType.TOUCH_START, this._toHome, this);
    this._resumeBtnNode.on(Node.EventType.TOUCH_START, this._onClose, this);
  }

  protected onDisable(): void {
    this._closeBtnNode.off(Node.EventType.TOUCH_START, this._onClose, this);
    this._homeBtnNode.off(Node.EventType.TOUCH_START, this._toHome, this);
    this._resumeBtnNode.off(Node.EventType.TOUCH_START, this._onClose, this);
  }
}
