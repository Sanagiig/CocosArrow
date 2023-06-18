import {
  _decorator,
  Camera,
  EventMouse,
  EventTouch,
  find,
  geometry,
  PhysicsSystem,
  SystemEvent,
  systemEvent,
  SystemEventType,
  Touch,
  v3,
} from "cc";
import { UIController } from "../../../Framework/Controllers/UIController";
import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
const { ccclass, property } = _decorator;

@ccclass("BaseUIController")
export class BaseUIController extends UIController {
  protected onLoad(): void {
    super.onLoad();
  }

  protected onEnable(): void {
    this.node.on(SystemEvent.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.on(SystemEvent.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.on(SystemEvent.EventType.TOUCH_END, this._onTouchEnd, this);
    this.node.on(SystemEvent.EventType.TOUCH_END, this._onTouchCancel, this);
    this.node.on(SystemEvent.EventType.MOUSE_DOWN, this.onSysStart, this);
  }

  protected onDisable(): void {
    this.node.off(SystemEvent.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.off(SystemEvent.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.off(SystemEvent.EventType.TOUCH_END, this._onTouchEnd, this);
    this.node.off(SystemEvent.EventType.TOUCH_END, this._onTouchCancel, this);
  }

  protected _onTouchStart(event: EventTouch) {
    EventManager.Instance.emit(Constant.EVENT_TYPE.UI_TOUCH_START, event);
  }

  protected _onTouchMove(event: EventTouch) {
    EventManager.Instance.emit(Constant.EVENT_TYPE.UI_TOUCH_MOVE, event);
  }

  protected _onTouchEnd(event: EventTouch) {
    EventManager.Instance.emit(Constant.EVENT_TYPE.UI_TOUCH_END, event);
  }

  protected _onTouchCancel(event: EventTouch) {
    EventManager.Instance.emit(Constant.EVENT_TYPE.UI_TOUCH_CANCEL, event);
  }

  onSysStart(event: EventMouse) {
    const loc = event.getLocation();
    const camera = find("MainCamera")!.getComponent(Camera)!;
    const wpos = camera.screenToWorld(v3(loc.x, loc.y, 0))!;
    const ray = new geometry.Ray(wpos.x, wpos?.y, wpos.z - 100, wpos.x, wpos.y, wpos.z + 100);

    camera.screenPointToRay(loc.x, loc.y, ray);
    PhysicsSystem.instance.raycastClosest(ray);
    // console.log("res.....",PhysicsSystem.instance.raycastClosestResult)
    // console.log("loc", loc, wpos,ray);
  }
}
