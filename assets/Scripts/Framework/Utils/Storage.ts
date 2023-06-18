import { log, sys } from "cc";
import { FrameworkConfig } from "../FrameworkConfig";
import CodeUtil from "./Shared/CodeUtil";

export default class Storage {
  private static _Instance: Storage;

  public static get Instance() {
    return Storage._Instance || new Storage();
  }

  public static set Instance(v: Storage) {
    throw new Error("can't set instance prop");
  }

  private _userId = "anyone";
  private _data: any;
  private _path: any = null;
  private _keyConfig: string = "archero"; //游戏英文名称
  private _markSave: boolean = false;
  private _saveTimer: number = -1;

  constructor() {
    if (Storage._Instance) {
      throw new Error("Storage is a singleton");
    }

    Storage._Instance = this;
    this._init();
  }

  private _webLocalSave(str: string, zipStr: string) {
    const key = this._keyConfig;
    console.log("FrameworkConfig.Instance.data.isDebugOpen",FrameworkConfig.Instance.data.isDebugOpen)
    if (FrameworkConfig.Instance.data.isDebugOpen) {
      sys.localStorage.setItem("debug_" + key, str);
    }
    sys.localStorage.setItem(key, zipStr);
  }

  private _nativeLocalSave(str: string, zipStr: string) {
    const data = { [this._keyConfig]: zipStr };

    if (FrameworkConfig.Instance.data.isDebugOpen) {
      data["debug_" + this._keyConfig] = str;
    }
    jsb.fileUtils.writeToFile(data);
  }

  localSave(data: any) {
    var str = JSON.stringify(data);
    let zipStr = "@" + CodeUtil.encrypt(str);

    this._markSave = false;
    if (sys.isNative) {
      this._nativeLocalSave(str, zipStr);
    } else {
      this._webLocalSave(str, zipStr);
    }
  }

  private _init() {
    this._path = this._getConfigPath();

    var content;
    if (sys.isNative) {
      var valueObject = jsb.fileUtils.getValueMapFromFile(this._path);
      content = valueObject[this._keyConfig];
    } else {
      content = sys.localStorage.getItem(this._keyConfig);
    }

    if (content && content.length) {
      if (content.startsWith("@")) {
        content = content.substring(1);
        content = CodeUtil.decrypt(content);
      }

      try {
        //初始化操作
        this._data = JSON.parse(content);
      } catch (excepaiton) {
        console.error("json 数据解析失败:\n", content);
      }
    } else {
      this._data = { [this._userId]: {} };
    }

    //每隔5秒保存一次数据，主要是为了保存最新在线时间，方便离线奖励时间判定
    this._saveTimer = setInterval(() => {
      this.scheduleSave();
    }, 5000);
  }

  /**
   * 存储配置文件，不保存到本地
   * @param {string}key  关键字
   * @param {any}value  存储值
   */
  setConfigDataWithoutSave(key: string, value: any) {
    if (this._data[this._userId]) {
      this._data[this._userId][key] = value;
    } else {
      console.error("no account can not save");
    }
  }

  /**
   * 存储配置文件，保存到本地
   * @param {string}key  关键字
   * @param {any}value  存储值
   */
  setData(key: string, value: any) {
    this.setConfigDataWithoutSave(key, value);
    this._markSave = true; //标记为需要存储，避免一直在写入，而是每隔一段时间进行写入
  }

  /**
   * 根据关键字获取数值
   * @param {string} key 关键字
   * @returns
   */
  getData(key: string) {
    const accData = this._data[this._userId];
    if (accData) {
      var value = accData[key];
      return value ? value : "";
    } else {
      log("no account can not load");
      return "";
    }
  }

  /**
   * 设置全局数据
   * @param {string} key 关键字
   * @param {any}value  存储值
   * @returns
   */
  public setGlobalData(key: string, value: any) {
    this._data[key] = value;
    this.save();
  }

  /**
   * 获取全局数据
   * @param {string} key 关键字
   * @returns
   */
  public getGlobalData(key: string) {
    return this._data[key];
  }

  /**
   * 设置用户唯一标示符
   * @param {string} userId 用户唯一标示符
   * @param {any}value  存储值
   * @returns
   */
  public setUserId(userId: string) {
    this._userId = userId;
    if (!this._data[userId]) {
      this._data[userId] = {};
    }

    this.save();
  }

  /**
   * 获取用户唯一标示符
   * @returns {string}
   */
  public getUserId() {
    return this._userId;
  }

  /**
   * 定时存储
   * @returns
   */
  public scheduleSave() {
    this.save();
  }

  /**
   * 标记为已修改
   */
  public markModified() {
    this._markSave = true;
  }

  /**
   * 保存配置文件
   * @returns
   */
  public save() {
    this.localSave(this._data);
  }

  public clear(){
    localStorage.clear();
  }

  /**
   * 获取配置文件路径
   * @returns 获取配置文件路径
   */
  private _getConfigPath() {
    let platform: any = sys.platform;

    let path: string = "";

    if (platform === sys.OS.WINDOWS) {
      path = "src/conf";
    } else if (platform === sys.OS.LINUX) {
      path = "./conf";
    } else {
      if (sys.isNative) {
        path = jsb.fileUtils.getWritablePath();
        path = path + "conf";
      } else {
        path = "src/conf";
      }
    }

    return path;
  }
}
