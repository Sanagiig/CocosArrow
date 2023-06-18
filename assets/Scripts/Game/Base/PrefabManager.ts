import { _decorator, Node, Prefab } from "cc";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";

type PrefabType = "warning" | "effect" | "model" | "ui";

export class PrefabManager {
  static _Instance: PrefabManager;
  static get Instance() {
    if (this._Instance) {
      return this._Instance;
    }

    this._Instance = new PrefabManager();
    return this._Instance;
  }

  private _prefabTypeMap: Map<PrefabType, Map<string, Prefab>> = new Map();
  init() {
    this._initData();
  }

  private _initData() {
    const warnings = ResManager.Instance.getAssets("Prefab", "/warning/") as Prefab[];
    const effects = ResManager.Instance.getAssets("Prefab", "/effect/") as Prefab[];
    const models = ResManager.Instance.getAssets("Prefab", "/model/") as Prefab[];
    const uis = ResManager.Instance.getAssets("Prefab", "/ui/") as Prefab[];

    const warningMap = new Map();
    const effectMap = new Map();
    const modelMap = new Map();
    const uiMap = new Map();

    this._prefabTypeMap.set("warning", warningMap);
    this._prefabTypeMap.set("effect", effectMap);
    this._prefabTypeMap.set("model", modelMap);
    this._prefabTypeMap.set("ui", uiMap);

    warnings.forEach(pf => {
      warningMap.set(pf.name || pf.data.name, pf);
    });

    effects.forEach(pf => {
      effectMap.set(pf.name || pf.data.name, pf);
    });

    models.forEach(pf => {
      modelMap.set(pf.name || pf.data.name, pf);
    });

    uis.forEach(pf => {
      uiMap.set(pf.name || pf.data.name, pf);
    });
  }

  getPrefabNode(type: PrefabType, name: string, parent: Node) {
    const prefab = this._prefabTypeMap.get(type).get(name);
    const node = PoolManager.instance.getNode(prefab, parent);
    return node;
  }
}
