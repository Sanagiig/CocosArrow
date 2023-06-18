export default class AssertUtil {
  /**
   * 判断传入的参数是否为空的Object。数组或undefined会返回false
   * @param obj
   */
  public static isEmptyObject(obj: any) {
    let result: boolean = true;
    if (obj && obj.constructor === Object) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          result = false;
          break;
        }
      }
    } else {
      result = false;
    }

    return result;
  }

  /**
   * 判断是否是新的一天
   * @param {Object|Number} dateValue 时间对象 todo MessageCenter 与 pve 相关的时间存储建议改为 Date 类型
   * @returns {boolean}
   */
  public static isNewDay(dateValue: any) {
    // todo：是否需要判断时区？
    var oldDate: any = new Date(dateValue);
    var curDate: any = new Date();

    //@ts-ignore
    var oldYear = oldDate.getYear();
    var oldMonth = oldDate.getMonth();
    var oldDay = oldDate.getDate();
    //@ts-ignore
    var curYear = curDate.getYear();
    var curMonth = curDate.getMonth();
    var curDay = curDate.getDate();

    if (curYear > oldYear) {
      return true;
    } else {
      if (curMonth > oldMonth) {
        return true;
      } else {
        if (curDay > oldDay) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 判断当前时间是否在有效时间内
   * @param {String|Number} start 起始时间。带有时区信息
   * @param {String|Number} end 结束时间。带有时区信息
   */
  public static isNowValid(start: any, end: any) {
    var startTime = new Date(start);
    var endTime = new Date(end);
    var result = false;

    if (startTime.getDate() + "" !== "NaN" && endTime.getDate() + "" !== "NaN") {
      var curDate = new Date();
      result = curDate < endTime && curDate > startTime;
    }

    return result;
  }

  public static isNumber(...datas: any[]) {
    let res = true;
    for (let i = 0; i < datas.length; i++) {
      const n = Number(datas[i]);
      if (Number.isNaN(n)) {
        res = false;
        break;
      }
    }

    return res;
  }

  public static inRange(min: number, max: number, num: number) {
    return num >= min && num <= max;
  }
}
