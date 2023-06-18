export default class TimeUtil {
  /**
   * 获取格式化后的日期（不含小时分秒）
   */
  public static getDay() {
    let date: Date = new Date();

    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  }

  /**
   * 根据剩余秒数格式化剩余时间 返回 HH:MM:SS
   * @param {Number} leftSec
   */
  public static formatTimeForSecond(leftSec: number, withoutSeconds: boolean = false) {
    let timeStr: string = "";
    let sec: number = leftSec % 60;

    let leftMin: number = Math.floor(leftSec / 60);
    leftMin = leftMin < 0 ? 0 : leftMin;

    let hour: number = Math.floor(leftMin / 60);
    let min: number = leftMin % 60;

    if (hour > 0) {
      timeStr += hour > 9 ? hour.toString() : "0" + hour;
      timeStr += ":";
    } else {
      timeStr += "00:";
    }

    timeStr += min > 9 ? min.toString() : "0" + min;

    if (!withoutSeconds) {
      timeStr += ":";
      timeStr += sec > 9 ? sec.toString() : "0" + sec;
    }

    return timeStr;
  }

  /**
   *  根据剩余毫秒数格式化剩余时间 返回 HH:MM:SS
   *
   * @param {Number} ms
   */
  public static formatTimeForMillisecond(ms: number): Object {
    let second: number = Math.floor((ms / 1000) % 60);
    let minute: number = Math.floor((ms / 1000 / 60) % 60);
    let hour: number = Math.floor(ms / 1000 / 60 / 60);
    return { hour: hour, minute: minute, second: second };
  }

  
  /**
   * 获得开始和结束两者之间相隔分钟数
   *
   * @static
   * @param {number} start
   * @param {number} end
   * @memberof Util
   */
  public static getOffsetMimutes(start: number, end: number) {
    let offSetTime: number = end - start;
    let minute: number = Math.floor((offSetTime % (1000 * 60 * 60)) / (1000 * 60));
    return minute;
  }

    /**
   * 根据格式返回时间
   * @param date  时间
   * @param fmt 格式
   * @returns
   */
    public static formatDate(date: Date, fmt: string) {
      let o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        S: date.getMilliseconds(), //毫秒
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
      //@ts-ignore
      for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
          fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length),
          );
      return fmt;
    }
  
}
