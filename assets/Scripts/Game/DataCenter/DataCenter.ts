import { _decorator, Component, Node, instantiate, TextAsset } from "cc";
import Storage from "../../Framework/Utils/Storage";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { CSVTableManager } from "../../Framework/Managers/DataManager/CSVTableManager";
import { EventManager } from "../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../Base/Constant";
const { ccclass } = _decorator;

export type SettingData = {
  isDebugOpen?: boolean;
  isMusicOpen?: boolean;
  isSoundOpen?: boolean;
  isVibrationOpen?: boolean;
  frameRate?: number;
};

export type PlayerData = {
  diamond?: number; //钻石总数
  gold?: number; //金币数量
  key?: number; //钥匙数量
  level?: number; //当前层级
  highestLevel?: number; //已经解锁的最高层级
  skillData?: string[]; //已经解锁的玩家技能ID
  createDate?: number; //记录创建时间
};

@ccclass("DataCenter")
export class DataCenter {
  static _Instance: DataCenter;
  static get Instance() {
    return this._Instance || new DataCenter();
  }

  private _gameCSV: CSVTableManager = new CSVTableManager();
  private _storage: Storage;

  public get csv() {
    return this._gameCSV;
  }

  constructor() {
    if (DataCenter._Instance) {
      throw new Error("DataCenter is a singleton");
    }

    this._storage = Storage.Instance;
    this._init();
    DataCenter._Instance = this;
    console.log("datacenter ", this);
  }

  private _init() {
    const player = this._storage.getData("player") || {};
    const setting = this._storage.getData("setting") || {};

    const defPlayer: PlayerData = {
      diamond: 0,
      gold: 0,
      key: 0,
      level: 1,
      highestLevel: 1,
      skillData: [],
      createDate: Date.now(),
    };

    const defSetting: SettingData = {
      isDebugOpen: false,
      isMusicOpen: true,
      isSoundOpen: true,
      isVibrationOpen: true,
      frameRate: 60,
    };

    Object.assign(defPlayer, player);
    Object.assign(defSetting,setting);

    this._storage.setData("player", defPlayer);
    this._storage.setData("setting", defSetting);
    this._storage.save();
  }

  loadGameConfig() {
    const asserts = ResManager.Instance.getAssets("Datas", "/") as TextAsset[];
    asserts.forEach(a => {
      this._gameCSV.addTable(a.name, a.text);
    });

    return DataCenter.Instance;
  }

  getPlayerData(): PlayerData {
    return this._storage.getData("player");
  }

  setPlayerData(data: PlayerData) {
    this._storage.setData("player", data);
    EventManager.Instance.emit(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER);
  }

  getPlayerItem<K extends keyof PlayerData>(k: K) {
    return this._storage.getData("player")[k];
  }

  setPlayerItem<K extends keyof PlayerData>(k: K, v: PlayerData[K]) {
    const pd = this._storage.getData("player");
    pd[k] = v;
    EventManager.Instance.emit(Constant.EVENT_TYPE.DATA_UPDATE_PLAYER);
  }

  updatePlayerData(data: any) {
    const pd = this.getPlayerData();
    this.setPlayerData(Object.assign(pd, data));
  }

  getSettingData(): SettingData {
    return this._storage.getData("setting");
  }

  setSettingData(data: SettingData) {
    this._storage.setData("setting", data);
  }

  getSettingItem<K extends keyof SettingData>(k: K): SettingData[K] {
    return this._storage.getData("setting")[k];
  }

  setSettingItem<K extends keyof SettingData>(k: K, v: SettingData[K]) {
    const data = this._storage.getData("setting");
    data[k] = v;
  }

  updateSettingData(data: SettingData) {
    const pd = this.getSettingData();
    this.setSettingData(Object.assign(pd, data));
  }

  save() {
    this._storage.save();
  }
}
