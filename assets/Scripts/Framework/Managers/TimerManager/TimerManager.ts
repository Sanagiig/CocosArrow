import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

type CB = (arg: any) => void;

class TimerNode {
  timerId: number = 0; // 标识这个timer的唯一Id号;
  param: any = null; // 用户要传的参数

  callback: CB = null as unknown as CB;
  duration: number = 0; // 定时器触发的时间间隔;
  delay: number = 0; // 第一次触发要隔多少时间;
  repeat: number = 0; // 你要触发的次数;
  isRemoved: boolean = false; // 是否已经删除了
  passedTime: number = 0; // 这个Timer过去的时间;
  totalDuration = 0; // 总共经历的时间
  triggleCound = 0; // 触发的次数
}

@ccclass("TimerManager")
export class TimerManager extends Component {
  static Instance: TimerManager;

  private autoIncId = 1;
  private timers: { [k: string]: TimerNode } = {}; // 这个timerId--->Timer对象隐映射
  private removeTimers: Array<TimerNode> = [];
  private newAddTimers: Array<TimerNode> = [];

  protected onLoad(): void {
    if (!TimerManager.Instance) {
      TimerManager.Instance = this;
    } else {
      this.destroy();
      return;
    }
    console.log("TimerManager", this);
  }

  ScheduleWithParams(func: CB, param: any, repeat: number, duration: number, delay: number = 0): number {
    let timer: TimerNode = new TimerNode();
    timer.callback = func;
    timer.param = param;
    timer.repeat = repeat;
    timer.duration = duration;
    timer.delay = delay;
    timer.passedTime = timer.duration;
    timer.isRemoved = false;

    timer.timerId = this.autoIncId;
    this.autoIncId++;

    // this.timers.Add(timer.timerId, timer);
    this.newAddTimers.push(timer);

    return timer.timerId;
  }

  Schedule(func: CB, repeat: number, duration: number, delay: number = 0): number {
    return this.ScheduleWithParams(func, null, repeat, duration, delay);
  }

  Once(func: CB, delay: number): number {
    return this.Schedule(func, 1, 0, delay);
  }

  ScheduleOnce(func: CB, param: any, delay: number): number {
    return this.ScheduleWithParams(func, param, 1, 0, delay);
  }

  ScheduleAlways(func: CB, param: any, duration: number, delay: number) {
    return this.ScheduleWithParams(func, param, -1, duration, delay);
  }

  Unschedule(timerId: number) {
    const timer: TimerNode = this.timers[timerId];
    if (timer) {
      timer.isRemoved = true;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.newAddTimers.length; i++) {
      this.timers[this.newAddTimers[i].timerId] = this.newAddTimers[i];
    }

    this.newAddTimers.length = 0;

    for (let key in this.timers) {
      var timer = this.timers[key];
      const triggleTime = timer.triggleCound ? timer.duration : timer.delay + timer.duration;

      if (timer.isRemoved) {
        this.removeTimers.push(timer);
        continue;
      }

      timer.passedTime += dt; // 更新一下timer时间
      timer.totalDuration += dt;
      if (timer.passedTime >= triggleTime) {
        const cb = timer.callback;
        // 做一次触发
        cb(timer.param);
        timer.passedTime -= triggleTime;
        timer.triggleCound++;

        if (timer.repeat !== -1) {
          timer.repeat--;
        }

        if (timer.repeat == 0) {
          timer.isRemoved = true;
          this.removeTimers.push(timer);
        }
      }
    }

    // 结束以后，清理掉要删除的Timer;
    for (let i = 0; i < this.removeTimers.length; i++) {
      delete this.timers[this.removeTimers[i].timerId];
    }
    this.removeTimers.length = 0;
    // end
  }
}
