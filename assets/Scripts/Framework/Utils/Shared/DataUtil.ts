import { Node, v3 } from "cc";

export default class DataUtil {
  /**
   * 从n个数中获取m个随机数
   * @param {Number} n   总数
   * @param {Number} m    获取数
   * @returns {Array} array   获取数列
   */
  public static getRandomNFromM(n: number, m: number) {
    let array: any[] = [];
    let intRd: number = 0;
    let count: number = 0;

    while (count < m) {
      if (count >= n + 1) {
        break;
      }

      intRd = this.getRandomInt(0, n);
      var flag = 0;
      for (var i = 0; i < count; i++) {
        if (array[i] === intRd) {
          flag = 1;
          break;
        }
      }

      if (flag === 0) {
        array[count] = intRd;
        count++;
      }
    }

    return array;
  }

  /**
   * 获取随机整数
   * @param {Number} min 最小值
   * @param {Number} max 最大值
   * @returns
   */
  public static getRandomInt(min: number, max: number) {
    return Math.floor(this.getRandom(min,max));
  }

  /**
   * 获取随机数
   * @param {Number} min 最小值
   * @param {Number} max 最大值
   * @returns
   */
  public static getRandom(min: number, max: number) {
    let r: number = Math.random();
    let rr: number = r * (max - min) + min;
    return rr;
  }

  /**
   * 根据权重,计算随机内容
   * @param {arrany} weightArr
   * @param {number} totalWeight 权重
   * @returns
   */
  public static getWeightRandIndex(weightArr: [], totalWeight: number) {
    let randWeight: number = Math.floor(Math.random() * totalWeight);
    let sum: number = 0;
    for (var weightIndex: number = 0; weightIndex < weightArr.length; weightIndex++) {
      sum += weightArr[weightIndex];
      if (randWeight < sum) {
        break;
      }
    }

    return weightIndex;
  }

  // 模拟传msg的uuid
  public static simulationUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
  }

  /**
   * 返回相隔天数
   * @param start
   * @param end
   * @returns
   */
  public static getDeltaDays(start: any, end: any) {
    start = new Date(start);
    end = new Date(end);

    let startYear: number = start.getFullYear();
    let startMonth: number = start.getMonth() + 1;
    let startDate: number = start.getDate();
    let endYear: number = end.getFullYear();
    let endMonth: number = end.getMonth() + 1;
    let endDate: number = end.getDate();

    start = new Date(startYear + "/" + startMonth + "/" + startDate + " GMT+0800").getTime();
    end = new Date(endYear + "/" + endMonth + "/" + endDate + " GMT+0800").getTime();

    let deltaTime = end - start;
    return Math.floor(deltaTime / (24 * 60 * 60 * 1000));
  }

  /**
   * 获取数组最小值
   * @param array 数组
   * @returns
   */
  public static getMin(array: number[]) {
    let result: number = null!;
    if (array.constructor === Array) {
      let length = array.length;
      for (let i = 0; i < length; i++) {
        if (i === 0) {
          result = Number(array[0]);
        } else {
          result = result > Number(array[i]) ? Number(array[i]) : result;
        }
      }
    }

    return result;
  }

  /**
   * 格式化两位小数点
   * @param time
   * @returns
   */
  public static formatTwoDigits(time: number) {
    //@ts-ignore
    return (Array(2).join(0) + time).slice(-2);
  }

  /**
   * 格式化钱数，超过10000 转换位 10K   10000K 转换为 10M
   * @param {number}money 需要被格式化的数值
   * @returns {string}返回 被格式化的数值
   */
  public static formatMoney(money: number) {
    let arrUnit: string[] = ["", "K", "M", "G", "T", "P", "E", "Z", "Y", "B", "N", "D"];

    let strValue: string = "";
    for (let idx: number = 0; idx < arrUnit.length; idx++) {
      if (money >= 10000) {
        money /= 1000;
      } else {
        strValue = Math.floor(money) + arrUnit[idx];
        break;
      }
    }

    if (strValue === "") {
      strValue = Math.floor(money) + "U"; //超过最大值就加个U
    }

    return strValue;
  }

  /**
   * 返回指定小数位的数值
   * @param {number} num
   * @param {number} idx
   */
  public static formatNumToFixed(num: number, idx: number = 0) {
    return Number(num.toFixed(idx));
  }

  /**
   * 用于数值到达另外一个目标数值之间进行平滑过渡运动效果
   * @param {number} targetValue 目标数值
   * @param {number} curValue 当前数值
   * @param {number} ratio    过渡比率
   * @returns
   */
  public static lerp(targetValue: number, curValue: number, ratio: number = 0.25) {
    let v: number = curValue;
    if (targetValue > curValue) {
      v = curValue + (targetValue - curValue) * ratio;
    } else if (targetValue < curValue) {
      v = curValue - (curValue - targetValue) * ratio;
    }

    return v;
  }

  /**
   * 解析数据表带有#或者,连接的数据
   *
   * @static
   * @param {string} str
   * @param {string} [symbol="#"]
   * @return {*}
   */
  public static parseStringData(str: string, symbol: string = "#"): any[] {
    let arr: any[] = str.split(symbol);
    return arr.map((item: any) => {
      return Number(item);
    });
  }

  
  /**
   * 获取两个节点的xz坐标的弧度
   *
   * @static
   * @param {Node} ndA
   * @param {Node} ndB
   * @param {boolean} [isLocal=false] 是否为本地坐标，反之为世界坐标
   * @return {*}
   */
  public static getTwoNodeXZRadius(ndA: Node, ndB: Node, isLocal: boolean = false) {
    const aX = isLocal ? ndA.position.x : ndA.worldPosition.x;
    const aZ = isLocal ? ndA.position.z : ndA.worldPosition.z;
    const bX = isLocal ? ndB.position.x : ndB.worldPosition.x;
    const bZ = isLocal ? ndB.position.z : ndB.worldPosition.z;
    return Math.atan2(aX - bX, aZ - bZ);
  }

  /**
   * 获取两个节点坐标在xz轴的距离
   *
   * @static
   * @param {Node} ndA
   * @param {Node} ndB
   * @param {boolean} [isLocal=false] 是否为本地坐标，反之为世界坐标
   * @return {*}
   */
  public static getTwoNodeXZLength(ndA: Node, ndB: Node, isLocal: boolean = false) {
    const aX = isLocal ? ndA.position.x : ndA.worldPosition.x;
    const aZ = isLocal ? ndA.position.z : ndA.worldPosition.z;
    const bX = isLocal ? ndB.position.x : ndB.worldPosition.x;
    const bZ = isLocal ? ndB.position.z : ndB.worldPosition.z;
    return this.getTwoPosXZLength(aX, aZ, bX, bZ);
  }

  /**
   * 获取两个坐标在xz轴的距离
   *
   * @static
   * @param {number} aX
   * @param {number} aZ
   * @param {number} bX
   * @param {number} bZ
   * @return {*}
   */
  public static getTwoPosXZLength(aX: number, aZ: number, bX: number, bZ: number) {
    const x = aX - bX;
    const z = aZ - bZ;
    return Math.sqrt(x * x + z * z);
  }

  /***
   * 返回随机方向
   */
  public static getRandomDirector() {
    let v = Math.random();
    return v > 0.5 ? 1 : -1;
  }

  public static str2V3(str: string) {
    const eles = str.split(",").map(s => Number(s));
    if (eles.length === 3) {
      return v3(eles[0], eles[1], eles[2]);
    }
  }
}
