import {
  _decorator,
  Collider,
  Component,
  EPSILON,
  ICollisionEvent,
  IContactEquation,
  Node,
  Quat,
  RigidBody,
  v3,
  Vec3,
} from "cc";
import { Constant } from "./Constant";
const { ccclass, property } = _decorator;

const v3Tmp1 = v3();
const v3Tmp2 = v3();

class ContactPoint {
  point = new Vec3();
  normal = new Vec3();
  collider!: Collider;
  assign(ce: IContactEquation, c: Collider) {
    if (ce.isBodyA) {
      ce.getWorldNormalOnB(this.normal);
      ce.getWorldPointOnA(this.point);
    } else {
      ce.getWorldNormalOnA(this.normal);
      ce.getWorldPointOnB(this.point);
    }
    this.collider = c;
    return this;
  }
}

const _ctPool: ContactPoint[] = [];
class ContactPool {
  static getContacts(ces: IContactEquation[], c: Collider, cps: ContactPoint[]) {
    for (let i = 0; i < ces.length; i++) {
      cps.push(this.getContact(ces[i], c));
    }
  }

  static getContact(ce: IContactEquation, c: Collider): ContactPoint {
    const cp = _ctPool.length > 0 ? _ctPool.pop()! : new ContactPoint();
    return cp.assign(ce, c);
  }

  static recyContacts(cps: ContactPoint[]) {
    Array.prototype.push.call(_ctPool, ...cps);
    cps.length = 0;
  }
}

@ccclass("EntityRigidController")
export class EntityRigidController extends Component {
  private _rigidBody: RigidBody = null!;
  private _collider: Collider = null!;
  private _grounded = true; //是否着地
  private _contacts: ContactPoint[] = []; //碰撞接触点
  private _groundContact: ContactPoint = null!; //与地面碰撞的点
  private _groundNormal = Vec3.UP.clone(); //地面法向量
  private _curMaxSpeed: number = 0; //当前最大速度

  private _targetRot: Quat = new Quat();
  protected _stateX: number = 0; // 1 positive, 0 static, -1 negative
  protected _stateZ: number = 0;

  isRotating = false;
  damping: number = 0.5; //阻尼
  gravity: number = -50; //重力
  rotAccuracy: number = 0.1;

  get velocity() {
    const v = v3();
    this._rigidBody.getLinearVelocity(v);
    return v;
  }

  get onGround() {
    return this._grounded;
  }

  onLoad() {
    this._rigidBody = this.getComponent(RigidBody)!;
    this._collider = this.getComponent(Collider)!;
    console.log("EntityRigidController", this);
  }

  setSpeed(moveSpeed: number, ratio: number = 1) {
    this._curMaxSpeed = moveSpeed * ratio;
  }

  /**
   * 角色移动传入x和z
   *
   * @param {number} x
   * @param {number} z
   */
  move(x: number, z: number) {
    this._stateX = x;
    this._stateZ = z;
  }

  /**
   * 刚体停止移动
   *
   */
  stopMove() {
    this._stateX = 0;
    this._stateZ = 0;
    this.clearVelocity();
  }

  /**
   * 清除移动速度
   */
  clearVelocity() {
    this._rigidBody.clearVelocity();
  }

  /**
   * 刚体移动
   *
   * @param {Vec3} dir
   * @param {number} speed
   */
  rigidMove(dir: Vec3, speed: number) {
    this._rigidBody.getLinearVelocity(v3Tmp1);
    Vec3.scaleAndAdd(v3Tmp1, v3Tmp1, dir, speed);

    const ms = this._curMaxSpeed;
    const len = v3Tmp1.length();
    if (len > ms) {
      v3Tmp1.normalize().multiplyScalar(ms);
    }
    this._rigidBody.setLinearVelocity(v3Tmp1);
  }

  clearState(){
    this._rigidBody.clearState();
  }

  /**
   * 施加阻尼
   *
   * @private
   * @param {number} [dt=1 / Constant.GAME_FRAME]
   */
  private _applyDamping(dt = 1 / Constant.GAME_FRAME) {
    this._rigidBody.getLinearVelocity(v3Tmp1);

    if (v3Tmp1.lengthSqr() > EPSILON) {
      v3Tmp1.multiplyScalar(Math.pow(1.0 - this.damping, dt));
      this._rigidBody.setLinearVelocity(v3Tmp1);
    }
  }

  /**
   * 施加重力
   *
   * @private
   */
  private _applyGravity() {
    const g = this.gravity;
    const m = this._rigidBody.mass;
    v3Tmp1.set(0, m * g, 0);
    this._rigidBody.applyForce(v3Tmp1);
  }

  /**
   * 更新碰撞信息，判断是否角色着地
   *
   * @private
   */
  private _updateContactInfo() {
    this._grounded = false;
    this._groundContact = null!;
    const wp = this.node.worldPosition;
    let maxY = -0.001;
    let offsetY = 0.5; //默认为0.1

    for (let i = 0; i < this._contacts.length; i++) {
      const c = this._contacts[i];
      const n = c.normal,
        p = c.point;
      if (n.y <= 0.0001) continue;
      else {
        if (n.y > maxY && p.y > wp.y - offsetY) {
          maxY = n.y;
          this._grounded = true;
          this._groundContact = c;
        }
      }
    }
    if (this._grounded) {
      Vec3.copy(this._groundNormal, this._groundContact.normal);
    } else {
      Vec3.copy(this._groundNormal, Vec3.UP);
    }
    ContactPool.recyContacts(this._contacts);
  }

  setRotate(dir: Vec3) {
    Quat.fromViewUp(this._targetRot, dir.clone().multiplyScalar(-1));

    const targetEuler = v3();
    const curEuler = this.node.eulerAngles;
    
    this._targetRot.getEulerAngles(targetEuler);

    if (Math.abs(targetEuler.y - curEuler.y) <= 20) {
      this.node.setRotation(this._targetRot);
      return;
    }

    this.isRotating = true;
  }

  private _updateRot() {
    if (!this.isRotating) {
      return;
    }

    const curEuler = this.node.eulerAngles.clone();
    const curQuat = new Quat();
    const targetEuler = v3();
    let rotAng = 0;
    this._targetRot.getEulerAngles(targetEuler);
    // 将角度调整至 0 - 360
    if (curEuler.y < 0) {
      curEuler.y += 360;
    } else if (curEuler.y > 360) {
      curEuler.y -= 360;
    }

    if (targetEuler.y < 0) {
      targetEuler.y += 360;
    } else if (targetEuler.y > 360) {
      targetEuler.y -= 360;
    }

    rotAng = Math.abs(targetEuler.y - curEuler.y);
    // 旋转角度 > 180 则用负角度（最接近的角度）
    if (rotAng > 180) {
      targetEuler.y = rotAng - 360;
    }

    Quat.fromEuler(curQuat, 0, curEuler.y, 0);
    Quat.fromEuler(this._targetRot, 0, targetEuler.y, 0);

    if (!curEuler.equals(targetEuler, this.rotAccuracy)) {
      Quat.fromEuler(curQuat, 0, curEuler.y, 0);
      Quat.lerp(curQuat, curQuat, this._targetRot, 0.2);
      this.node.setRotation(curQuat);
    } else {
      this.isRotating = false;
    }
  }

  /**
   * 刷新
   * @param dt
   */
  updateState() {
    this._updateContactInfo();
    this._applyGravity();
    this._applyDamping();
  }

  /**
   * 更新刚体状态
   *
   * @private
   * @param {number} dt
   * @return {*}
   */
  private _updateRigid() {
    this.updateState();

    // if (!this.onGround) return;

    if (this._stateX || this._stateZ) {
      v3Tmp2.set(this._stateX, 0, this._stateZ);
      this.setRotate(v3Tmp2);
      this.rigidMove(v3Tmp2, 1);
    }
  }

  onEnable() {
    this._collider.on("onCollisionEnter", this._onCollision, this);
    this._collider.on("onCollisionStay", this._onCollision, this);
    this._collider.on("onCollisionExit", this._onCollision, this);
  }

  onDisable() {
    this._collider.off("onCollisionEnter", this._onCollision, this);
    this._collider.off("onCollisionStay", this._onCollision, this);
    this._collider.off("onCollisionExit", this._onCollision, this);
  }

  /**
   * 检测碰撞，收集碰撞信息
   *
   * @private
   * @param {ICollisionEvent} event
   */
  private _onCollision(event: ICollisionEvent) {
    ContactPool.getContacts(event.contacts, event.selfCollider, this._contacts);
  }

  update(dtS: number) {
    this._updateRigid();
    this._updateRot();
  }
}
