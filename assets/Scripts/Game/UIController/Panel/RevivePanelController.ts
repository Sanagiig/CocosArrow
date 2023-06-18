import { _decorator, Component, Label, Node, instantiate, UITransform, Mask } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { TimerManager } from "../../../Framework/Managers/TimerManager/TimerManager";
import { Player } from "../../Player/Player";
import { UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { DataCenter } from "../../DataCenter/DataCenter";
import { GameApp } from "../../GameApp";
import { Constant } from "../../Base/Constant";
import { AudioManager } from "../../../Framework/Managers/AudioManager/AudioManager";
const { ccclass, property } = _decorator;

@ccclass("RevivePanelController")
export class RevivePanelController extends UIController {
  private _levelLabel: Label;
  private _skipBtnNode: Node;
  private _reviveBtnNode: Node;
  private _countDownLabel: Label;
  private _heartNode: Node;
  private _countDownTimerID: number;

  protected onLoad(): void {
    super.onLoad();
    this._initData();
    this._initEvent();
    console.log("RevivePanelController", this);
  }

  private _initData() {
    this._skipBtnNode = this.getViewNode("/container/btnSkip");
    this._reviveBtnNode = this.getViewNode("/container/btnRevive");
    this._heartNode = this.getViewNode("/container/heart");
    this._levelLabel = this.getViewNode("/container/light/level").getComponent(Label);
    this._countDownLabel = this.getViewNode("/container/lbCountdown").getComponent(Label);
  }

  private _initEvent() {
    this._skipBtnNode.on(Node.EventType.TOUCH_START, this._onSkipTouch, this);
    this._reviveBtnNode.on(Node.EventType.TOUCH_START, this._onReviveTouch, this);
  }

  display(): void {
    const heartSize = this._heartNode
      .getChildByPath("mask/settlementHeart02")
      .getComponent(UITransform).contentSize;
    const maskContent = this._heartNode.getChildByName("mask").getComponent(UITransform).contentSize;
    const max = 10;

    this._levelLabel.string = `${DataCenter.Instance.getPlayerItem("level")}`;
    this.node.setSiblingIndex(100);
    super.display();

    maskContent.set(maskContent.width, 0);
    this._countDownLabel.string = `${max}`;
    this._countDownTimerID = TimerManager.Instance.ScheduleAlways(
      () => {
        const num = Number(this._countDownLabel.string) - 1;
        if (num < 0) {
          TimerManager.Instance.Unschedule(this._countDownTimerID);
          this._toHome();
          return;
        }

        this._heartNode
          .getChildByName("mask")
          .getComponent(UITransform)
          .setContentSize(maskContent.width, (1 - num / max) * heartSize.height);
        this._countDownLabel.string = `${num}`;
      },
      null,
      1,
      0,
    );
  }

  hide(): void {
    super.hide();
    TimerManager.Instance.Unschedule(this._countDownTimerID);
  }

  private _toHome() {
    GameApp.Instance.recycle();
    UIManager.Instance.hideAll();
    UIManager.Instance.display("HomePanel");
  }

  private _onSkipTouch() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    this._toHome();
  }

  private _onReviveTouch() {
    AudioManager.Instance.playSound(Constant.SOUND.CLICK);
    Player.Instance.revive();
    this.hide();
  }

  protected onDestroy(): void {
    this._skipBtnNode.off(Node.EventType.TOUCH_START, this._onSkipTouch, this);
    this._reviveBtnNode.off(Node.EventType.TOUCH_START, this._onReviveTouch, this);
  }
}
