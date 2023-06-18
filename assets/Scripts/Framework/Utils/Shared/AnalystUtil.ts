export default class AnalystUtil {
  /**
   * 获取性能等级
   * -Android
   * 设备性能等级，取值为：
   * -2 或 0（该设备无法运行小游戏）
   * -1（性能未知）
   * >=1（设备性能值，该值越高，设备性能越好，目前最高不到50)
   * -IOS
   * 微信不支持IO性能等级
   * iPhone 5s 及以下
   * 设定为超低端机 benchmarkLevel = 5
   * iPhone 6 ～ iPhone SE
   * 设定为超低端机 benchmarkLevel = 15
   * iPhone 7 ~ iPhone X
   * 设定为中端机 benchmarkLevel = 25
   * iPhone XS 及以上
   * 设定为高端机 benchmarkLevel = 40
   * -H5或其他
   * -1（性能未知）
   */
  public static getBenchmarkLevel(): number {
    //@ts-ignore
    if (window.wx) {
      //@ts-ignore
      const sys = window.wx.getSystemInfoSync();
      const isIOS = sys.system.indexOf("iOS") >= 0;
      if (isIOS) {
        const model = sys.model;
        // iPhone 5s 及以下
        const ultraLowPhoneType = [
          "iPhone1,1",
          "iPhone1,2",
          "iPhone2,1",
          "iPhone3,1",
          "iPhone3,3",
          "iPhone4,1",
          "iPhone5,1",
          "iPhone5,2",
          "iPhone5,3",
          "iPhone5,4",
          "iPhone6,1",
          "iPhone6,2",
        ];
        // iPhone 6 ~ iPhone SE
        const lowPhoneType = ["iPhone6,2", "iPhone7,1", "iPhone7,2", "iPhone8,1", "iPhone8,2", "iPhone8,4"];
        // iPhone 7 ~ iPhone X
        const middlePhoneType = [
          "iPhone9,1",
          "iPhone9,2",
          "iPhone9,3",
          "iPhone9,4",
          "iPhone10,1",
          "iPhone10,2",
          "iPhone10,3",
          "iPhone10,4",
          "iPhone10,5",
          "iPhone10,6",
        ];
        // iPhone XS 及以上
        const highPhoneType = [
          "iPhone11,2",
          "iPhone11,4",
          "iPhone11,6",
          "iPhone11,8",
          "iPhone12,1",
          "iPhone12,3",
          "iPhone12,5",
          "iPhone12,8",
        ];
        for (let i = 0; i < ultraLowPhoneType.length; i++) {
          if (model.indexOf(ultraLowPhoneType[i]) >= 0) return 5;
        }
        for (let i = 0; i < lowPhoneType.length; i++) {
          if (model.indexOf(lowPhoneType[i]) >= 0) return 10;
        }
        for (let i = 0; i < middlePhoneType.length; i++) {
          if (model.indexOf(middlePhoneType[i]) >= 0) return 20;
        }
        for (let i = 0; i < highPhoneType.length; i++) {
          if (model.indexOf(highPhoneType[i]) >= 0) return 30;
        }
        return -1;
      } else {
        return sys.benchmarkLevel;
      }
    } else {
      return 50;
    }
  }

  /**
   * 低端机判断
   */
  public static checkIsLowPhone() {
    let checkBenchmark = 22; //判断低端机的性能等级

    return this.getBenchmarkLevel() < checkBenchmark;
  }
}
