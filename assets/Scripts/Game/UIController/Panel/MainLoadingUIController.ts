import { _decorator, Component, Node, ProgressBar } from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
const { ccclass, property } = _decorator;

@ccclass("MainLoadingUIController")
export class MainLoadingUIController extends UIController {
  protected onLoad(): void {
    super.onLoad();
    EventManager.Instance.on(Constant.EVENT_TYPE.UI_MAIN_LOADING_PROGRESS, this.onProcess, this);
  }

  private onProcess(cur: number, total: number) {
    const pb = this.getViewNode("/ProgressBar").getComponent(ProgressBar)!;
    pb.progress = cur / total;
  }
}
