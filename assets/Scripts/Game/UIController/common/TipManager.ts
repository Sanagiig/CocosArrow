import { Label, Node, Pool, Prefab, find } from "cc";
import { PrefabManager } from "../../Base/PrefabManager";
import { TimerManager } from "../../../Framework/Managers/TimerManager/TimerManager";
import { PoolManager } from "../../../Framework/Managers/PoolManager/PoolManager";

export default class TipBarManager {
  static _Instance: TipBarManager;
  private _container: Node;
  private _displayTimeout = 2;
  private _maxTipNum = 3;

  static get Instance() {
    if (this._Instance) {
      return this._Instance;
    }

    this._Instance = new TipBarManager();
    return this._Instance;
  }

  constructor() {
    if (TipBarManager._Instance) {
      throw new Error("TipBarManager exist");
    }

    this._initData();
    console.log("TipBarManager", this);
  }

  private _initData() {
    this._container = find("/UICanvas/TipContainer");
  }

  tip(content: string) {
    const tipBar = PrefabManager.Instance.getPrefabNode("ui", "TipBar", this._container);
    tipBar.getChildByName("Label").getComponent(Label).string = content;
    this._container.setSiblingIndex(100);
    if (this._container.children.length > this._maxTipNum) {
      PoolManager.instance.putNode(this._container.children[0]);
    }

    TimerManager.Instance.Once(() => {
      if (tipBar.parent) {
        PoolManager.instance.putNode(tipBar);
      }
    }, this._displayTimeout);
  }
}
