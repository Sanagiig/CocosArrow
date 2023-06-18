import { _decorator, Component, Node } from "cc";
import { EventManager } from "../EventManager/EventManager";
import { EventType } from "../EventManager/EventType";
import { TimerManager } from "../TimerManager/TimerManager";
const { ccclass, property } = _decorator;

export enum NetState {
  Disconnected = 0, // 断开连接
  Connecting = 1, // 正在连接
  Connected = 2, // 已经连接;
  ConnectErr = 3,
}

@ccclass("NetManager")
export class NetManager extends Component {
  public static Instance: NetManager;

  private url: string = "ws://127.0.0.1:6081/ws";
  private state = NetState.Disconnected;
  private sock: WebSocket | null = null;
  protected onLoad(): void {
    if (!NetManager.Instance) {
      NetManager.Instance = this;
    } else {
      this.destroy();
      return;
    }
  }

  init(url: string): void {
    this.url = url;
    this.state = NetState.Disconnected;
  }

  connect() {
    if ([NetState.Connected, NetState.Connecting].indexOf(this.state) != -1) {
      return;
    }

    // 抛出一个正在重新连接的事件;
    EventManager.Instance.emit(EventType.NET_CONNECTING, null);

    this.state = NetState.Connecting;
    this.sock = new WebSocket(this.url); // H5标准，底层做好了;
    this.sock.binaryType = "arraybuffer"; // blob, 二进制;

    this.sock.onopen = this.onConnected.bind(this);
    this.sock.onerror = this.onConnectErr.bind(this);
    this.sock.onmessage = this.onRecvData.bind(this);
    this.sock.onclose = this.onConnectClose.bind(this);
  }

  sendData(buff: ArrayBuffer) {
    if (this.state !== NetState.Connected) {
      console.error("websocket not connected");
      return;
    }

    this.sock?.send(buff);
  }

  close() {
    if (this.state === NetState.Connected) {
      if (this.sock) {
        this.sock.close();
        this.sock = null;
      }
    }

    EventManager.Instance.emit(EventType.NET_CLOSE);
    this.state = NetState.Disconnected;
  }

  private onConnected(event: Event) {
    this.state = NetState.Connected;
    console.log("connect to server: " + this.url + " sucess!");
    EventManager.Instance.emit(EventType.NET_CONNECTED, null);
  }

  private onConnectErr(event: Event) {
    this.state = NetState.ConnectErr;
    console.log("connect err", event);
    EventManager.Instance.emit(EventType.NET_CONNECT_ERR);
    TimerManager.Instance.scheduleOnce(() => {
      this.connect();
    }, 1);
  }

  private onRecvData(event: MessageEvent) {
    EventManager.Instance.emit(EventType.NET_RECV_DATA, event.data);
  }

  private onConnectClose(event: CloseEvent) {
    this.close();
  }
}
