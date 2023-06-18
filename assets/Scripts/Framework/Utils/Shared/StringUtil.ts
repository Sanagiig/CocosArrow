import ArrayUtil from "./ArrayUtil";

export default class StringUtil {
  /**
   * 获取字符串长度
   * @param {string} render
   * @returns
   */
  public static getStringLength(render: string) {
    let strArr: string = render;
    let len: number = 0;
    for (let i: number = 0, n = strArr.length; i < n; i++) {
      let val: number = strArr.charCodeAt(i);
      if (val <= 255) {
        len = len + 1;
      } else {
        len = len + 2;
      }
    }

    return Math.ceil(len / 2);
  }

  
  /**
   * 格式化名字，XXX...
   * @param {string} name 需要格式化的字符串
   * @param {number}limit
   * @returns {string} 返回格式化后的字符串XXX...
   */
  public static formatName(name: string, limit: number) {
    limit = limit || 6;
    var nameArray = ArrayUtil.stringToArray(name);
    var str = "";
    var length = nameArray.length;
    if (length > limit) {
      for (var i = 0; i < limit; i++) {
        str += nameArray[i];
      }

      str += "...";
    } else {
      str = name;
    }

    return str;
  }

  public static trim(str: string) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
  }

    /**
   * 格式化数值
   * @param {number}value 需要被格式化的数值
   * @returns {string}返回 被格式化的数值
   */
    public static formatValue(value: number) {
      let arrUnit: string[] = [];
      let strValue: string = "";
      for (let i = 0; i < 26; i++) {
        arrUnit.push(String.fromCharCode(97 + i));
      }
  
      for (let idx: number = 0; idx < arrUnit.length; idx++) {
        if (value >= 10000) {
          value /= 1000;
        } else {
          strValue = Math.floor(value) + arrUnit[idx];
          break;
        }
      }
  
      return strValue;
    }

}
