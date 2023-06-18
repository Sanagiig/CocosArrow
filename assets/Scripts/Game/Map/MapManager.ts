import { _decorator, Component, Node, Vec3, Game, Prefab, instantiate } from "cc";
// import { Monster } from './monster';
// import { Boss } from './boss';
// import { AudioManager } from '../framework/audioManager';

import { Constant } from "../Base/Constant";
import { PoolManager } from "../../Framework/Managers/PoolManager/PoolManager";
import { GameApp } from "../GameApp";
import { EventManager } from "../../Framework/Managers/EventManager/EventManager";
import { ResManager } from "../../Framework/Managers/ResManager/ResManager";
import { Monster } from "../Enemy/Monster/Monster";
import { Boss } from "../Enemy/Boss/Boss";
import { DataCenter } from "../DataCenter/DataCenter";
import DataUtil from "../../Framework/Utils/Shared/DataUtil";
import { EnemyManager } from "../Enemy/EnemyManager";
import { BaseInfoType, ModelInfoType } from "../DataCenter/DataType";
import { TimerManager } from "../../Framework/Managers/TimerManager/TimerManager";
import { AudioManager } from "../../Framework/Managers/AudioManager/AudioManager";
import { EffectManager } from "../Effect/EffectManager";
import { ColliderItemController, ColliderItemType } from "../Base/ColliderItemController";
const { ccclass, property } = _decorator;
//关卡模型管理组件（怪物、爱心、障碍、npc）

@ccclass("MapManager")
export class MapManager extends Component {
  static Instance: MapManager;

  private _anMapNode: Node = null!; //默认暗夜地图节点
  private _ansMapNode: Node = null!; //S型暗夜地图节点
  private _ndCloud: Node = null!; //云
  private _gateNode: Node = null!; //传送门
  private _warpGateWorPos_1: Vec3 = new Vec3(16.414, 1.635, -0.804); //an地图传送门位置
  private _warpGateWorPos_2: Vec3 = new Vec3(34.61, 1.635, -20); //anS地图传送门位置
  private _modelNodeList: any = []; //存放各项模块节点信息, 除了道路,在玩家后面一定距离则进行回收
  private _mapData: any = []; //当前关卡数据表
  private _modelTypeDic: any; //待加载的模型种类
  private _timerID: number;

  isMapAnS: boolean = false; //是否是S型暗夜地图

  protected onLoad(): void {
    if (!MapManager.Instance) {
      MapManager.Instance = this;
    } else {
      this.destroy();
    }
    console.log("MapManager", this);
  }

  private _startCheckMapState() {
    if (this._timerID) {
      TimerManager.Instance.Unschedule(this._timerID);
    }

    this._timerID = TimerManager.Instance.ScheduleAlways(
      () => {
        if (!EnemyManager.Instance.hasAliveMonster()) {
          if (!this._gateNode || !this._gateNode.active) {
            this._showGate();
          }
        }
      },
      null,
      0.5,
      0.5,
    );
  }

  private _showGate() {
    if (!this._gateNode) {
      const prefab = ResManager.Instance.getAsset("Prefab", "/model/warpGate/warpGate") as Prefab;
      let colliderCtr: ColliderItemController;

      this._gateNode = instantiate(prefab);
      colliderCtr = this._gateNode.addComponent(ColliderItemController);
      colliderCtr.setType(ColliderItemType.WARP_GATE);
      this._gateNode.parent = this.node;
    }

    const gatePos = this.isMapAnS ? this._warpGateWorPos_2 : this._warpGateWorPos_1;
    AudioManager.Instance.playSound(Constant.SOUND.SHOW_WRAP_GATE);

    this._gateNode.setWorldPosition(gatePos);
    this._gateNode.active = true;
    EffectManager.Instance.playNodeTail(this._gateNode);
    AudioManager.Instance.playSound(Constant.SOUND.SHOW_WRAP_GATE);
  }

  private _hideGate() {
    if (this._gateNode) {
      this._gateNode.active = false;
    }
  }

  buildMap(mapName: string) {
    const csv = DataCenter.Instance.csv;

    this.recycle();
    this._modelTypeDic = {};
    this._modelNodeList = [];
    this._mapData = csv.queryAll(mapName) as ModelInfoType[];

    if (!this._ndCloud) {
      const prefab = ResManager.Instance.getAsset("Prefab", "model/scene/cloud") as Prefab;
      this._ndCloud = PoolManager.instance.getNode(prefab, this.node);
    }

    if (mapName.startsWith("map0") && !this._anMapNode) {
      const prefab = ResManager.Instance.getAsset("Prefab", "model/scene/an") as Prefab;
      this._anMapNode = PoolManager.instance.getNode(prefab, this.node);
    } else if (mapName.startsWith("map1") && !this._ansMapNode) {
      const prefab = ResManager.Instance.getAsset("Prefab", "model/scene/anS") as Prefab;
      this._ansMapNode = PoolManager.instance.getNode(prefab, this.node);
    }

    if (mapName.startsWith("map1")) {
      this._anMapNode && (this._anMapNode.active = false);
      this._ansMapNode && (this._ansMapNode.active = true);
      this.isMapAnS = true;
    } else {
      this._anMapNode && (this._anMapNode.active = true);
      this._ansMapNode && (this._ansMapNode.active = false);
      this.isMapAnS = false;
    }

    EventManager.Instance.emit(Constant.EVENT_TYPE.HIDE_BOSS_BLOOD_BAR);
    EnemyManager.Instance.clear();
    this._hideGate();
    this._buildModels();
    this._startCheckMapState();
  }

  private _buildModels() {
    this._mapData.forEach((row: ModelInfoType) => {
      let baseInfo = DataCenter.Instance.csv.queryOneByID("base", row.ID);

      const type = baseInfo.type;
      if (!this._modelTypeDic[type]) {
        this._modelTypeDic[type] = [];
      }
      this._modelTypeDic[type].push(row);
    });

    for (const typeName in this._modelTypeDic) {
      let item = this._modelTypeDic[typeName];

      if (item && item.length) {
        this._buildModel(typeName);
      }
    }
  }

  private _buildModel(type: string) {
    const csv = DataCenter.Instance.csv;
    let objItems = this._modelTypeDic[type]; //同类型的信息

    for (let idx = 0; idx < objItems.length; idx++) {
      //怪物在该层级别的配置信息
      let modelInfo = objItems[idx];
      //怪物的模块数据
      let baseInfo = csv.queryOneByID("base", modelInfo.ID) as BaseInfoType;

      let modelPath = `model/${type}/${baseInfo.resName}`;
      const prefab = ResManager.Instance.getAsset("Prefab", modelPath) as Prefab;
      let gourpName = type + "Group"; //先创建父节点
      let groupNode = this.node.getChildByName(gourpName);
      if (!groupNode) {
        groupNode = new Node(gourpName);
        this.node.addChild(groupNode);
      }

      let childNode = PoolManager.instance.getNode(prefab, groupNode) as Node;

      childNode.setPosition(DataUtil.str2V3(modelInfo.position || baseInfo.position));
      childNode.setRotationFromEuler(DataUtil.str2V3(modelInfo.angle || baseInfo.angle));
      childNode.setScale(DataUtil.str2V3(modelInfo.scale || baseInfo.scale));

      if (baseInfo.type === Constant.BASE_TYPE.MONSTER) {
        const ctr = childNode?.getComponent(Monster) || childNode?.addComponent(Monster)!;
        EnemyManager.Instance.addMonster(childNode);
        ctr.init(baseInfo, modelInfo);
      } else if (baseInfo.type === Constant.BASE_TYPE.BOSS) {
        GameApp.Instance.bossNode = childNode;
        GameApp.Instance.boss = childNode?.getComponent(Boss) || childNode?.addComponent(Boss)!;
        EnemyManager.Instance.addMonster(childNode);
        GameApp.Instance.boss.init(baseInfo, modelInfo);
      } else if (baseInfo.type === Constant.BASE_TYPE.NPC) {
        console.log("baseInfo",baseInfo)
        const ctr =
          childNode.getComponent(ColliderItemController) || childNode.addComponent(ColliderItemController);
        ctr.colliderType =
          baseInfo.resName === "wiseMan" ? ColliderItemType.NPC_WISE_MAN : ColliderItemType.NPC_BUSINESS_MAN;
      } else if (baseInfo.type === Constant.BASE_TYPE.HEART) {
        const ctr =
          childNode.getComponent(ColliderItemController) || childNode.addComponent(ColliderItemController);
        ctr.colliderType = ColliderItemType.HEART_BIG;
      }

      this._modelNodeList.push(childNode);
    }
  }

  /**
   * 回收模块
   */
  recycle() {
    this._modelNodeList.forEach(model => {
      this._recycleModel(model);
    });
  }

  hide() {
    this.node.active = false;
  }

  display() {
    this.node.active = true;
  }

  /**
   * 回收子模块
   * @param ndItem
   */
  private _recycleModel(ndItem: Node) {
    PoolManager.instance.putNode(ndItem);
  }
}
