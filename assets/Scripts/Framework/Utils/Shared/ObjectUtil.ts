export default class ObjectUtil {
  /**
   * !#zh 拷贝object。
   */
  /**
   * 深度拷贝
   * @param {any} sObj 拷贝的对象
   * @returns
   */
  public static clone(sObj: any) {
    if (sObj === null || typeof sObj !== "object") {
      return sObj;
    }

    let s: { [key: string]: any } = {};
    if (sObj.constructor === Array) {
      s = [];
    }

    for (let i in sObj) {
      if (sObj.hasOwnProperty(i)) {
        s[i] = this.clone(sObj[i]);
      }
    }

    return s;
  }

  /**
   * !#zh 将数组转化为object。
   */
  /**
   * 将数组转化为object。
   * @param { any} srcObj
   * @param { string} objectKey
   * @returns
   */
  public static arrayToObject(srcObj: any, objectKey: string) {
    let resultObj: { [key: string]: any } = {};

    // to object
    for (var key in srcObj) {
      if (!srcObj.hasOwnProperty(key) || !srcObj[key][objectKey]) {
        continue;
      }

      resultObj[srcObj[key][objectKey]] = srcObj[key];
    }

    return resultObj;
  }

  
  /**
   * 获取对象属性数量
   * @param {object}o 对象
   * @returns
   */
  public static getPropertyCount(o: Object) {
    var n,
      count = 0;
    for (n in o) {
      if (o.hasOwnProperty(n)) {
        count++;
      }
    }
    return count;
  }
}
