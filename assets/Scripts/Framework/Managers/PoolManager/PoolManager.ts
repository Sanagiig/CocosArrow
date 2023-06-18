import { _decorator, Prefab, Node, instantiate, NodePool } from "cc";
const { ccclass, property } = _decorator;

type DicPoolMap = { [k: string]: NodePool };
type DicPrefabMap = { [k: string]: Prefab };

@ccclass("PoolManager")
export class PoolManager {
  static _instance: PoolManager;
  static get instance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new PoolManager();
    return this._instance;
  }

  private _dictPool: DicPoolMap = {};
  private _dictPrefab: DicPrefabMap = {};

  /**
   * 根据预设从对象池中获取对应节点
   */
  getNode(prefab: Prefab, parent: Node) {
    let name = prefab.name;
    //@ts-ignore
    if (!prefab.position) {
      //@ts-ignore
      name = prefab.data.name;
    }

    this._dictPrefab[name] = prefab;
    let node:Node = null;
    if (this._dictPool.hasOwnProperty(name)) {
      //已有对应的对象池
      let pool = this._dictPool[name];
      if (pool.size() > 0) {
        node = pool.get();
      }
    } else {
      //没有对应对象池，创建他！
      let pool = new NodePool();
      this._dictPool[name] = pool;
    }

    if (!node) {
      node = instantiate(prefab);
    }

    node.active = true;
    parent.addChild(node);
    return node;
  }

  /**
   * 将对应节点放回对象池中
   */
  putNode(node: Node) {
    if (!node) {
      return;
    }
    let name = node.name;
    let pool = null;
    if (this._dictPool.hasOwnProperty(name)) {
      //已有对应的对象池
      pool = this._dictPool[name];
    } else {
      //没有对应对象池，创建他！
      pool = new NodePool();
      this._dictPool[name] = pool;
    }

    pool.put(node);
  }

  /**
   * 根据名称，清除对应对象池
   */
  clearPool(name: string) {
    if (this._dictPool.hasOwnProperty(name)) {
      let pool = this._dictPool[name];
      pool.clear();
    }
  }
}
