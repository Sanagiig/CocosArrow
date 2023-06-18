import { _decorator, Component, EventTouch, macro, Node, SystemEvent, UITransform, v3, Vec3 } from "cc";
import AssertUtil from "./Shared/AssertUtil";
import Macro from "./Shared/Macro";
const { ccclass, property } = _decorator;

export enum StickMode {
  FOLLOW,
  ALLWAYS_FOLLOW,
  FIXED,
}

export enum DirectionCount {
  ALL,
  FOUR = 4,
  EIGHT = 8,
}

export type JoystickConfig = {
  ring: Node;
  dot: Node;
  radius: number;
  linker: Linker;
  mode?: StickMode;
  directionCount?: DirectionCount;
  // dot 是否会因为限制方向而改变显示
  toFixDotByDir?: boolean;
  // FOLLOW 模式时, ring 出现的范围
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
};

export type MoveActionData = {
  type: "move" | "stop";
  direction?: Vec3;
  ang?: number;
  rad?: number;
};

export interface Linker {
  moveAction(d: MoveActionData): void;
}

@ccclass("Joystick")
export class Joystick extends Component {
  private _isInit = false;
  private _ringNode: Node;
  private _dotNode: Node;
  private _ringOriPos: Vec3 = null!;
  private _dotOriPos: Vec3 = null!;
  private _linker: Linker;

  private _mode: StickMode;
  private _directionCount: DirectionCount;
  private _toFixDotByDir: boolean;
  private _radius: number;
  private _minX: number;
  private _maxX: number;
  private _minY: number;
  private _maxY: number;

  private _curMoveActionData: MoveActionData = null!;
  private _isRunning = false;

  /**
   * 初始化摇杆，放在onload 会出现坐标不准确的问题
   * @param config
   * @returns
   */
  init(config: JoystickConfig) {
    this._ringNode = config.ring;
    this._dotNode = config.dot;
    this._radius = config.radius;
    this._toFixDotByDir = config.toFixDotByDir ?? true;
    this._minX = config.minX;
    this._maxX = config.maxX;
    this._minY = config.minY;
    this._maxY = config.maxY;
    this._mode = config.mode ?? StickMode.FOLLOW;
    this._directionCount = config.directionCount ?? DirectionCount.ALL;
    this._linker = config.linker;

    this._isInit = true;
    this._setupEvent();
    return this;
  }

  private _setupEvent() {
    this.node.on(SystemEvent.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.on(SystemEvent.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.on(SystemEvent.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    this.node.on(SystemEvent.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  private _unloadEvent() {
    this.node.off(SystemEvent.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.off(SystemEvent.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.off(SystemEvent.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    this.node.off(SystemEvent.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  private _resetStickPos() {
    if (StickMode.FOLLOW === this._mode) {
      this._ringNode.setPosition(this._ringOriPos);
    }

    this._isRunning = false;
    this._dotNode.setPosition(this._dotOriPos);
    this._linker.moveAction({ type: "stop" });
  }

  // 按照方向类型固定摇杆方向
  private _adjustDotDirection(v: Vec3) {
    if (this._directionCount === DirectionCount.ALL) {
      return;
    }

    const dirCount = this._directionCount;
    const stepAng = 360 / dirCount;
    const len = v.length();
    let dirAng = Math.atan2(v.y, v.x) * Macro.Ang;

    // 调整至 0 - 360
    if (dirAng < 0) {
      dirAng += 360;
    }

    for (let i = 0; i <= dirCount; i++) {
      const curBaseAng = i * stepAng;
      const ang = Math.abs(curBaseAng - dirAng);
      const isMathed =
        (dirCount === DirectionCount.FOUR && ang < 45) || (dirCount === DirectionCount.EIGHT && ang < 22.5);

      if (isMathed) {
        dirAng = curBaseAng;
        break;
      }
    }

    v.set(Math.cos(dirAng * Macro.Rad), Math.sin(dirAng * Macro.Rad), 0).multiplyScalar(len);
  }

  private _resetRing() {
    this._ringOriPos && this._ringNode.setPosition(this._ringOriPos);
    this._dotOriPos && this._dotNode.setPosition(this._dotOriPos);
    this._curMoveActionData = null;
  }

  protected onEnable(): void {
    if (this._isInit) {
      this._setupEvent();
      this._resetRing();
    }
  }

  protected onDisable(): void {
    if (this._isInit) {
      this._unloadEvent();
    }
  }

  private _onTouchStart(event: EventTouch) {
    // 记录节点坐标，不能放在 init,不然会导致坐标不准确
    if (!this._ringOriPos || !this._dotOriPos) {
      this._ringOriPos = this._ringNode.getPosition();
      this._dotOriPos = this._dotNode.getPosition();
    }

    const uiLoc = event.getUILocation();

    if ([StickMode.ALLWAYS_FOLLOW, StickMode.FOLLOW].indexOf(this._mode) !== -1) {
      const targetPos = this.getComponent(UITransform).convertToNodeSpaceAR(v3(uiLoc.x, uiLoc.y, 0));
      const isInRange =
        !AssertUtil.isNumber(this._minX, this._minY, this._maxX, this._maxY) ||
        (AssertUtil.inRange(this._minX, this._maxX, uiLoc.x) &&
          AssertUtil.inRange(this._minY, this._maxX, uiLoc.y));

      if (isInRange) {
        this._isRunning = true;
        this._ringNode.setPosition(targetPos);
      }
      return;
    }

    const targetPos = this._ringNode.getComponent(UITransform).convertToNodeSpaceAR(v3(uiLoc.x, uiLoc.y, 0));
    this._isRunning = targetPos.subtract(this._dotOriPos).length() <= this._radius;
  }

  private _onTouchMove(event: EventTouch) {
    if (!this._isRunning) {
      return;
    }

    const uiLoc = event.getUILocation();
    const dotTargetPos = this._ringNode
      .getComponent(UITransform)
      .convertToNodeSpaceAR(v3(uiLoc.x, uiLoc.y, 0));
    const distV3 = dotTargetPos.subtract(this._dotOriPos);
    let ang;

    if (distV3.length() > this._radius) {
      distV3.normalize().multiplyScalar(this._radius);
    }

    const adjustedDist = distV3.clone();

    this._adjustDotDirection(adjustedDist);
    if (this._toFixDotByDir) {
      this._dotNode.setPosition(adjustedDist);
    } else {
      this._dotNode.setPosition(distV3);
    }

    ang = Math.atan2(adjustedDist.y, adjustedDist.x) * Macro.Ang;
    this._curMoveActionData = { type: "move", direction: adjustedDist, ang, rad: ang * Macro.Rad };
  }

  private _onTouchCancel(event: EventTouch) {
    this._resetStickPos();
  }

  private _onTouchEnd(event: EventTouch) {
    this._resetStickPos();
  }

  protected update(dt: number): void {
    if (this._isRunning && this._curMoveActionData) {
      this._linker.moveAction(this._curMoveActionData);
    }
  }
}
