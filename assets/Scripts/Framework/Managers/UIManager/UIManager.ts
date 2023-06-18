import { _decorator, Component, find, instantiate, Node, Prefab } from "cc";
import { ResManager } from "../ResManager/ResManager";
import { FrameworkConfig } from "../../FrameworkConfig";
import { UIController } from "../../Controllers/UIController";
const { ccclass } = _decorator;

export type UIInfo<T = UIController> = {
  name: string;
  controllerName: string;
  parent: Node;
  node: Node;
  controller?: T;
};

@ccclass("UIManager")
export class UIManager extends Component {
  public static Instance: UIManager;

  private uiInfoMap: Map<string, UIInfo> = new Map();
  private canvas: Node = null as unknown as Node;

  protected onLoad(): void {
    if (!UIManager.Instance) {
      UIManager.Instance = this;
    } else {
      this.destroy();
      return;
    }

    this.canvas = find("UICanvas")!;
  }

  getUIInfo(viewName: string) {
    const uiInfo = this.uiInfoMap.get(viewName);

    if (!uiInfo) {
      if (FrameworkConfig.Instance.data.isDebugOpen) {
        console.error("UIManager:", viewName, " not exits.");
      }
      return;
    }
    return uiInfo;
  }

  // 触发UI控制器方法
  private _triggleUIControllerMethod(viewName: string, methodName: string) {
    const uiInfo = this.getUIInfo(viewName);
    const controller = uiInfo?.controller;
    let res = false;
    if (controller && typeof controller[methodName] === "function") {
      controller[methodName]();
      res = true;
    }

    return res;
  }

  setupUI(
    viewName: string,
    view: Prefab,
    isDisplay: boolean = false,
    hasController: boolean = true,
    parent: Node = this.canvas,
  ) {
    let uiInfo = this.getUIInfo(viewName);
    let controller = null;
    if (uiInfo) {
      return uiInfo;
    }

    const node = instantiate(view);
    if (hasController) {
      controller = node.addComponent(`${viewName}Controller`);
    }

    uiInfo = {
      name: viewName,
      controllerName: viewName + "Controller",
      node,
      parent,
      controller,
    };

    parent.addChild(node);
    this.uiInfoMap.set(viewName, uiInfo);
    return uiInfo;
  }

  loadUIView(
    viewName: string,
    isDisplay: boolean = false,
    hasController: boolean = true,
    parent: Node = this.canvas,
  ) {
    return this.loadUIViewByPath("GUI", `UIPrefabs/${viewName}`, viewName, isDisplay, hasController, parent);
  }

  loadUIViewByPath(
    abName: string,
    path: string,
    viewName: string,
    isDisplay: boolean = false,
    hasController: boolean = true,
    parent: Node = this.canvas,
  ) {
    const uiPrefab = ResManager.Instance.getAsset(abName, `${path}/${viewName}`) as Prefab;
    return this.setupUI(viewName, uiPrefab, isDisplay, hasController, parent);
  }

  hide(viewName: string) {
    const uiInfo = this.getUIInfo(viewName);
    if (uiInfo) {
      if (!this._triggleUIControllerMethod(viewName, "hide")) {
        uiInfo.node.active = false;
      }
    }
  }

  hideAll() {
    for (let [name] of this.uiInfoMap) {
      const info = this.uiInfoMap.get(name)
      if(info.node.active){
        this.hide(name);
      }
    }
  }

  display(viewName: string) {
    const uiInfo = this.getUIInfo(viewName);
    if (uiInfo) {
      if (!this._triggleUIControllerMethod(viewName, "display")) {
        uiInfo.node.active = true;
      }
    }
  }

  remove(viewName: string) {
    const uiInfo = this.getUIInfo(viewName);
    if (uiInfo) {
      if (!this._triggleUIControllerMethod(viewName, "remove")) {
        uiInfo.node.removeFromParent();
        uiInfo.node.destroy();
      }
      this.uiInfoMap.delete(viewName);
    }
  }
}
