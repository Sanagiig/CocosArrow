import { _decorator, Collider, Component, ICollisionEvent, Node, tween, Tween, v3, Vec3 } from "cc";
import { BaseInfoType } from "../DataCenter/DataType";
import DataUtil from "../../Framework/Utils/Shared/DataUtil";
import { Constant } from "../Base/Constant";
import { DataCenter } from "../DataCenter/DataCenter";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { Player } from "../Player/Player";
import { TimerManager } from "../../Framework/Managers/TimerManager/TimerManager";
import { AudioManager } from "../../Framework/Managers/AudioManager/AudioManager";
import { EventManager } from "../../Framework/Managers/EventManager/EventManager";
const { ccclass, property } = _decorator;

@ccclass("Reward")
export class Reward extends Component {
  private _collider: Collider;
  private _pos: Vec3;
  private _tween: Tween<any>;
  private _idx: number = 0;
  private _timerID: number = 0;
  private _offsetNum = 0.5;
  private _isToPlayer = false;
  private _curSpeed = 15;

  baseInfo: BaseInfoType;

  protected onLoad(): void {
    this._collider = this.getComponent(Collider) || this.addComponent(Collider);
    console.log('Reward"', this);
  }

  setup(baseInfo: BaseInfoType, pos: Vec3, idx: number = 0) {
    const offset = v3(
      DataUtil.getRandom(-this._offsetNum, this._offsetNum),
      0,
      DataUtil.getRandom(-this._offsetNum, this._offsetNum),
    );
    this.baseInfo = baseInfo;
    this.node.setWorldPosition(pos.x, 2.5, pos.z);
    this._pos = pos.add(offset);
    this._idx = idx;
    this.display();
  }

  display() {
    this._stopTween();
    AudioManager.Instance.playSound(Constant.SOUND.GOLD_DROP);
    this._tween = tween(this.node)
      .to(0.3, { position: this._pos })
      .to(0.5, { eulerAngles: v3(0, 360, 0) })
      .repeat(10)
      .start();

    this._timerID = TimerManager.Instance.Once(() => {
      this.toPlayer();
    }, 1);
  }

  private _stopTween() {
    if (this._tween) {
      this._tween.stop();
    }

    if (this._timerID) {
      TimerManager.Instance.Unschedule(this._timerID);
    }
  }

  private _onColliderEnter(event: ICollisionEvent) {
    const other = event.otherCollider;
    if (other.getGroup() === Constant.PHY_GROUP.PLAYER) {
      const playerData = DataCenter.Instance.getPlayerData();
      switch (this.node.name) {
        case "gold":
          playerData.gold++;
          EventManager.Instance.emit(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER);
          AudioManager.Instance.playSound(Constant.SOUND.GOLD_COLLECT);
          break;
        case "heart":
          Player.Instance.refreshBlood(Player.Instance.curHpLimit * 0.1);
          AudioManager.Instance.playSound(Constant.SOUND.RECOVERY);
          break;
      }
      this.recycle();
    }
  }

  protected onEnable(): void {
    this._collider.on("onTriggerEnter", this._onColliderEnter, this);
  }

  protected onDisable(): void {
    this._collider.off("onTriggerEnter", this._onColliderEnter, this);
  }

  toPlayer() {
    this._isToPlayer = true;
  }

  recycle() {
    this._stopTween();
    PoolManager.instance.putNode(this.node);
  }

  protected update(dt: number): void {
    if (this._isToPlayer) {
      const dir = Player.Instance.node
        .getWorldPosition()
        .subtract(this.node.worldPosition)
        .normalize()
        .multiplyScalar(dt * this._curSpeed);

      this.node.setWorldPosition(this.node.worldPosition.add(dir));
    }
  }
}
