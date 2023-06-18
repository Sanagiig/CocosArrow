export default class NumberUtil{
  
  /**
   * 返回精确到若干位数的数值
   *
   * @static
   * @param {number} v
   * @param {number} digit
   */
  public static toFixed(v: number, digit: number = 2) {
    return Number(v.toFixed(digit));
  }
}