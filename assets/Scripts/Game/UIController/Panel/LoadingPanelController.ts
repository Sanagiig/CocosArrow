import { _decorator, AnimationComponent, Animation } from "cc";

import { Constant } from "../../Base/Constant";
import { UIInfo, UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { GameApp } from "../../GameApp";
import { UIController } from "../../../Framework/Controllers/UIController";
import { ResManager } from "../../../Framework/Managers/ResManager/ResManager";
const { ccclass, property } = _decorator;

@ccclass("LoadingPanelController")
export class LoadingPanelController extends UIController {
  public aniCloud: Animation = null!;

  protected onLoad(): void {
    super.onLoad();
    EventManager.Instance.on(Constant.EVENT_TYPE.SHOW_LOADING_PANEL, this.display, this);
    EventManager.Instance.on(Constant.EVENT_TYPE.HIDE_LOADING_PANEL, this.hide, this);
  }

  protected start(): void {
    this.aniCloud = this.getComponent(Animation);
  }

  onDestroy() {
    EventManager.Instance.off(Constant.EVENT_TYPE.SHOW_LOADING_PANEL, this.display, this);
    EventManager.Instance.off(Constant.EVENT_TYPE.HIDE_LOADING_PANEL, this.hide, this);
  }

  display(): void {
    super.display();
    this.aniCloud.getState("cloudAnimationIn").time = 0;
    this.aniCloud.getState("cloudAnimationIn").sample();
    this.aniCloud.play("cloudAnimationIn");
  }

  hide(): void {

    GameApp.Instance.gameCamera.resetCamera();

    this.aniCloud.getState("cloudAnimationOut").time = 0;
    this.aniCloud.getState("cloudAnimationOut").sample();
    this.aniCloud.play("cloudAnimationOut");

    this.aniCloud.once(AnimationComponent.EventType.FINISHED, () => {
      super.hide();
    });
  }
}
