import {
  Node,
  ParticleSystemComponent,
  Vec3,
  _decorator,
  AnimationComponent,
  AnimationState,
  Material,
  MeshColliderComponent,
  MeshRenderer,
} from "cc";

import { EventManager } from "../../../Framework/Managers/EventManager/EventManager";
import { Constant } from "../../Base/Constant";
import { UIManager } from "../../../Framework/Managers/UIManager/UIManager";
import { EffectManager } from "../../Effect/EffectManager";
import { PoolManager } from "../../../Framework/Managers/PoolManager/PoolManager";
import { GameApp } from "../../GameApp";
import { Monster } from "../Monster/Monster";
import { MonsterModel } from "../Monster/MonsterModel";

const { ccclass, property } = _decorator;
//大龙boss组件, 继承monster怪物组件
@ccclass("Boss")
export class Boss extends Monster {
}
