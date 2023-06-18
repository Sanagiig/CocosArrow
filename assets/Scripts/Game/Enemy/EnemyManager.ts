import { _decorator, Component, Node, v3, Vec3 } from "cc";
import { Monster } from "./Monster/Monster";
import { Player } from "../Player/Player";
const { ccclass, property } = _decorator;

@ccclass("EnemyManager")
export class EnemyManager extends Component {
  static Instance: EnemyManager;

  private _monsterNodeList = [] as Node[];

  get monsters() {
    return this._monsterNodeList.slice();
  }

  protected onLoad(): void {
    if (!EnemyManager.Instance) {
      EnemyManager.Instance = this;
    } else {
      this.destroy();
      console.error("GameApp was loaded");
      return;
    }
  }

  hasAliveMonster() {
    return !!this._monsterNodeList.find(item => item.parent);
  }

  addMonster(node: Node) {
    this._monsterNodeList.push(node);
  }

  canAttack(pos1: Vec3, pos2: Vec3, radius: number = 10) {
    return pos1.clone().subtract(pos2).length() <= radius;
  }

  canSearchPlayer(pos: Vec3, radius: number) {
    if (Player.Instance.isDie) {
      return false;
    }

    const ppos = Player.Instance.node.getWorldPosition();
    const p = pos.clone();

    p.y = 0;
    ppos.y = 0;
    return p.subtract(ppos).length() <= radius;
  }

  getNearestMonster(pos: Vec3, radius: number = 10) {
    const monList = this.monsters.sort((a, b) => {
      const av = v3();
      const bv = v3();
      const len1 = Vec3.subtract(av, a.worldPosition, pos).length();
      const len2 = Vec3.subtract(bv, b.worldPosition, pos).length();
      return len1 - len2;
    });

    for (let i = 0; i < monList.length; i++) {
      const node = monList[i];
      const comp = node.getComponent(Monster);
      const v = node.getWorldPosition();
      const len = Vec3.subtract(v, v, pos).length();
      if (len <= radius && !comp.isDie) {
        return node;
      }
    }
  }

  getAllNearMonster(pos: Vec3, radius: number = 10, ...exclude: Node[]) {
    const monList = this.monsters;
    const res:Node[] =[];
    for (let i = 0; i < monList.length; i++) {
      const node = monList[i];
      const comp = node.getComponent(Monster);
      const v = node.getWorldPosition();
      const len = Vec3.subtract(v, v, pos).length();
      if (len <= radius && !comp.isDie && exclude.indexOf(node) === -1) {
        res.push(node);
      }
    }

    return res;
  }

  getToPlayerVec(pos: Vec3) {
    const ppos = Player.Instance.node.getWorldPosition();
    return ppos.clone().subtract(pos);
  }

  clear() {
    this._monsterNodeList.forEach(mon => {
      const ctr = mon.getComponent(Monster);
      ctr.recycle();
    });

    this._monsterNodeList.length = 0;
  }
}
