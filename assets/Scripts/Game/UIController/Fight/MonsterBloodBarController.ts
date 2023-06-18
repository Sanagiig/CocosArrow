import { _decorator, Component, UITransformComponent, tween, clamp, Vec3, Node, find, UITransform } from "cc";
import { Constant } from "../../Base/Constant";
import { PoolManager } from "../../../Framework/Managers/PoolManager/PoolManager";
import { GameApp } from "../../GameApp";
import { BaseBloodBarController } from "./BaseBloodBarController";

//boss和小怪血条组件

const { ccclass, property } = _decorator;
@ccclass("MonsterBloodBarController")
export class MonsterBloodBarController extends BaseBloodBarController {
}
