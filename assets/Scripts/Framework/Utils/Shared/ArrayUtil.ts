export default class ArrayUtil {
  public static stringToArray(string: string) {
    // 用于判断emoji的正则们
    var rsAstralRange = "\\ud800-\\udfff";
    var rsZWJ = "\\u200d";
    var rsVarRange = "\\ufe0e\\ufe0f";
    var rsComboMarksRange = "\\u0300-\\u036f";
    var reComboHalfMarksRange = "\\ufe20-\\ufe2f";
    var rsComboSymbolsRange = "\\u20d0-\\u20ff";
    var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
    var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");

    var rsFitz = "\\ud83c[\\udffb-\\udfff]";
    var rsOptVar = "[" + rsVarRange + "]?";
    var rsCombo = "[" + rsComboRange + "]";
    var rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")";
    var reOptMod = rsModifier + "?";
    var rsAstral = "[" + rsAstralRange + "]";
    var rsNonAstral = "[^" + rsAstralRange + "]";
    var rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}";
    var rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]";
    var rsOptJoin =
      "(?:" +
      rsZWJ +
      "(?:" +
      [rsNonAstral, rsRegional, rsSurrPair].join("|") +
      ")" +
      rsOptVar +
      reOptMod +
      ")*";
    var rsSeq = rsOptVar + reOptMod + rsOptJoin;
    var rsSymbol =
      "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
    var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");

    var hasUnicode = function (val: any) {
      return reHasUnicode.test(val);
    };

    var unicodeToArray = function (val: any) {
      return val.match(reUnicode) || [];
    };

    var asciiToArray = function (val: any) {
      return val.split("");
    };

    return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
  }

  /**
   * 将object转化为数组
   * @param { any} srcObj
   * @returns
   */
  public static objectToArray(srcObj: { [key: string]: any }) {
    let resultArr: any[] = [];

    // to array
    for (let key in srcObj) {
      if (!srcObj.hasOwnProperty(key)) {
        continue;
      }

      resultArr.push(srcObj[key]);
    }

    return resultArr;
  }

  /**
   * 返回一个差异化数组（将array中diff里的值去掉）
   * @param array
   * @param diff
   */
  public static difference(array: [], diff: any) {
    let result: any[] = [];
    if (array.constructor !== Array || diff.constructor !== Array) {
      return result;
    }

    let length = array.length;
    for (let i: number = 0; i < length; i++) {
      if (diff.indexOf(array[i]) === -1) {
        result.push(array[i]);
      }
    }

    return result;
  }

  /**
   * 将数组内容进行随机排列
   * @param {Array}arr 需要被随机的数组
   * @returns
   */
  public static rand(arr: any[]) {
    let arrClone = arr.slice();
    // 首先从最大的数开始遍历，之后递减
    for (let i: number = arrClone.length - 1; i >= 0; i--) {
      // 随机索引值randomIndex是从0-arrClone.length中随机抽取的
      const randomIndex: number = Math.floor(Math.random() * (i + 1));
      // 下面三句相当于把从数组中随机抽取到的值与当前遍历的值互换位置
      const itemIndex: number = arrClone[randomIndex];
      arrClone[randomIndex] = arrClone[i];
      arrClone[i] = itemIndex;
    }
    // 每一次的遍历都相当于把从数组中随机抽取（不重复）的一个元素放到数组的最后面（索引顺序为：len-1,len-2,len-3......0）
    return arrClone;
  }

  /**
   * 洗牌函数
   *
   * @static
   * @param {*} arr
   * @returns
   */
  public static shuffle(arr: any) {
    if (Array.isArray(arr)) {
      let newArr: any = arr.concat();
      newArr.sort(() => {
        return 0.5 - Math.random();
      });
      return newArr;
    }
  }

  /**
   * 两个数值数组取相同的值，返回一个新数组
   *
   * @static
   * @param {number[]} arr1
   * @param {number[]} arr2
   * @returns
   */
  public static filterDifferentValue(arr1: number[], arr2: number[]) {
    let arr: number[] = [];
    arr = arr1.filter((item: number) => {
      return arr2.indexOf(item) !== -1;
    });

    return arr;
  }

  /**
   * 获取数组中随机一个元素
   * @param arr
   * @returns
   */
  public static getRandomItemFromArray(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public static removeItem(list: any[], item: any) {
    const idx = list.indexOf(item);
    if (idx !== -1) {
      list.splice(idx, 1);
      return true;
    }
  }

  public static removeAllItem(list: any[], item: any) {
    let res = true;
    while (res) {
      res = this.removeItem(list, item);
    }
  }

  public static equals(l1: any[], l2: any[]) {
    if (l1.length !== l2.length) {
      return false;
    }

    for (let i = 0; i < l1.length; i++) {
      if (l1[i] !== l2[i]) {
        return false;
      }
    }

    return true;
  }
}
