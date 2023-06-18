import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

// electron模块，打包web-mobil后在HTML中定义全局变量electron
const ele = (window as any).electron;

@ccclass("ElectronAPI")
export default class ElectronAPI {
  // e代表electron

  /**
   * @zh 移动窗口到中心
   */
  static center(): void {
    ele && ele.ipcRenderer.send("e_center");
  }

  /**
   * @zh 全屏
   */
  static fullScreen() {
    ele && ele.ipcRenderer.send("e_fullScreen");
  }

  /**
   * @zh 窗口化
   */
  static window() {
    ele && ele.ipcRenderer.send("e_window");
  }

  /**
   * @zh 打开开发者工具
   */
  static openDevTools() {
    ele && ele.ipcRenderer.send("e_openDevTools");
  }

  /**
   * @zh 关闭开发者工具
   */
  static closeDevTools() {
    ele && ele.ipcRenderer.send("e_closeDevTools");
  }

  /**
   * @zh 设置窗口大小
   */
  static setSize(width: number, height: number) {
    ele && ele.ipcRenderer.send("e_setSize", width.toString(), height.toString());
  }

  /**
   * @zh 设置分辨率，修改的显示器的分辨率
   */
  static setResolution(width: number, height: number) {
    ele && ele.ipcRenderer.send("e_setResolution", width.toString(), height.toString());
  }

  /**
   * @zh 当前是否全屏
   * @return 返回boolean
   */
  static isFullScreen(): boolean {
    return ele && ele.ipcRenderer.sendSync("e_isFullScreen");
  }

  /**
   * @zh 设置分辨率，如果全屏将设置显示器分辨率，不全屏将设置窗口大小
   */
  static setScreenResolution(width: number, height: number) {
    if (this.isFullScreen() == true) {
      this.setResolution(width, height);
    } else {
      this.setSize(width, height);
    }
  }

  /**
   * @zh 自定义nircmd命令，不需要在前面输入nircmd.exe
   */
  static nircmdUD(order: string) {
    ele && ele.ipcRenderer.send("e_nircmdUD", order);
  }

  /**
   * @zh 获取一些信息，返回string
   */
  static getMassage(): string {
    return ele && ele.ipcRenderer.sendSync("e_getMassage");
  }

  /**
     * @zh 获取屏幕支持的所有分辨率，返回一个string的数组
     * @example 
     * ```ts
     * let e = ElectronAPI.getAllResolutions();
     * console.log(e);
     * 
     * 打印结果如下
     * [
        "1920×1080",
        "1680×1050",
        "1600×900",
        "1440×900",
        "1400×1050",
        "1366×768",
        "1360×768",
        "1280×1024",
        "1280×960",
        "1280×800",
        "1280×768",
        "1280×720",
        "1280×600",
        "1152×864",
        "1024×768",
        "800×600"
        ]
     * ```
     */
  static getAllResolutions(): string[] {
    return ele && ele.ipcRenderer.sendSync("e_getAllResolutions");
  }

  /**
   * @zh 获取当前的屏幕分辨率，是一个string变量
   * @example
   * ```ts
   * let e = ElectronAPI.getCurrentResolution();
   * console.log(e);
   *
   * 打印结果如下
   * '1920×1080'
   * ```
   */
  static getCurrentResolution(): string {
    return ele && ele.ipcRenderer.sendSync("e_getCurrentResolution");
  }

  /**
   * @zh 退出游戏
   */
  static quit() {
    ele && ele.ipcRenderer.send("e_quit");
  }
}
