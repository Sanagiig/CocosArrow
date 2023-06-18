import { _decorator, Component, Node } from "cc";
import { EventType } from "./EventType";
const { ccclass } = _decorator;

type Callback = Function;
export type EventInfos = {
  cb: Callback;
  ctx: any;
};

@ccclass("EventManager")
export class EventManager extends Component {
  public static Instance: EventManager;

  private eventMap: Map<string, EventInfos[]> = new Map();

  protected onLoad(): void {
    if (!EventManager.Instance) {
      EventManager.Instance = this;
    } else {
      this.destroy();
      return;
    }
  }

  on(eventName: string, cb: Callback, ctx: any = null) {
    let eventInfos = this.eventMap.get(eventName);
    const info = { ctx, cb };
    if (eventInfos) {
      eventInfos.push(info);
      return;
    }

    this.eventMap.set(eventName, [info]);
  }

  off(eventName: string, cb?: Callback, ctx: any = null) {
    let eventInfos = this.eventMap.get(eventName);

    if (!eventInfos) {
      return;
    }

    if (!cb && !ctx) {
      this.eventMap.set(eventName, []);
      return;
    }

    if (eventInfos) {
      console.log("infos",[...eventInfos])
      for (let i = eventInfos.length - 1; i >= 0; i--) {
        const info = eventInfos[i];
        const isDel =
          cb && !ctx ? info.cb === cb : !cb && ctx ? info.ctx === ctx : info.cb === cb && info.ctx === ctx;

        if (isDel) {
          eventInfos.splice(i, 1);
        }
      }
    }
  }

  emit(eventName: string, ...params: any[]) {
    const eventInfos = this.eventMap.get(eventName);

    if (eventInfos) {
      eventInfos.forEach(info => {
        info.cb.apply(info.ctx, params);
      });
    }
  }
}
