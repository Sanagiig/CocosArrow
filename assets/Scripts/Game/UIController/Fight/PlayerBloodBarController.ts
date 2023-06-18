import { Node, UITransform, _decorator, instantiate, math } from "cc";
import { BaseBloodBarController } from "./BaseBloodBarController";
import { TimerManager } from "../../../Framework/Managers/TimerManager/TimerManager";

//血条组件
const { ccclass, property } = _decorator;
@ccclass("PlayerBloodBarController")
export class PlayerBloodBarController extends BaseBloodBarController {
  private _barWidth: number = 100;
  private _containerNode: Node;
  protected onLoad(): void {
    super.onLoad();
    this._barWidth = this.getViewNode("/curBloodBar").getComponent(UITransform).contentSize.width;
    this._containerNode = this.getViewNode("/container");
    console.log("PlayerBloodBarController", this);
  }

  private _syncLineCount(num: number) {
    const containerNode = this._containerNode;
    const lineNode = containerNode.children[0];
    let curLineCount = containerNode.children.length;
    let diffNum = num - curLineCount;

    if (diffNum > 0) {
      while (diffNum-- > 0) {
        const node = instantiate(lineNode);
        containerNode.addChild(node);
      }
    } else {
      while (curLineCount-- > num) {
        this._containerNode.children[curLineCount].active = false;
      }
    }
  }

  // 分割线
  private _setupBloodLine() {
    // const width = this._containerNode.getComponent(UITransform).contentSize.width;
    const width = 100;
    const totalHP = this._totalHP;
    const blockNum = Math.ceil(totalHP / width);
    const unitWidth = this._barWidth / blockNum;
    this._syncLineCount(blockNum - 1);

    // 在onload | start 的时候装载会导致 setPosition 的值被改....
    for (let i = 1; i < blockNum; i++) {
      const lineNode = this._containerNode.children[i - 1];
      lineNode.active = true;
      lineNode.setPosition(i * unitWidth, 0, 0);
      lineNode.setScale(1, 0.5, 1);
    }
  }

  setup(target: Node, offset: math.Vec3, totalHP: number, curHP: number): void {
    super.setup(target, offset, totalHP, curHP);
    this._setupBloodLine();
  }
}
