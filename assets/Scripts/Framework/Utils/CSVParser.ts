const CELL_DELIMITERS = [",", ";", "\t", "|", "^"];
const LINE_DELIMITERS = ["\r\n", "\r", "\n"];

export type DecodeOps = {
  delimiter: string;
  lineDelimit: string;
  comment?: string;
  skip?: number;
  limit?: boolean;
  header?: boolean;
};

const csvParseOpts = {
  delimiter: CELL_DELIMITERS[0],
  lineDelimit: LINE_DELIMITERS[2],
  skip: 0,
  limit: false,
  header: true,
};

export enum CSVCast {
  Number = "number",
  Boolean = "boolean",
  String = "string",
}

export class CSVData {
  public row: number = 0;

  get length() {
    return this.content.length;
  }
  constructor(
    private comments: string[],
    private casts: CSVCast[],
    private fields: string[],
    private content: Array<string[]>,
  ) {
    this.row = content.length;
  }

  private castData(cell: string, i: number) {
    const cast = this.casts[i];

    switch (cast) {
      case CSVCast.Number:
        return Number(cell);
      case CSVCast.Boolean:
        return ["t", "true", "True", "TRUE", "1"].indexOf(cell) !== -1;
      case CSVCast.String:
        return cell;
      default:
        return cell;
    }
  }

  private _getFieldIdx(field: string) {
    return this.fields.indexOf(field);
  }

  getDataByIdx(i: number, j: number) {
    if (i === -1 || j === -1) {
      return null;
    }

    const cell = this.content[i][j];
    return this.castData(cell, j);
  }

  queryCol(i: number): any[] {
    return this.content.map(line => {
      return this.castData(line[i], i);
    });
  }

  queryRow(i: number) {
    const res = [] as any[];
    const row = this.content[i];

    if (row) {
      row.forEach((line, idx) => {
        res.push(this.castData(line, idx));
      });
    }

    return res;
  }

  queryByRow(i: number) {
    const row = this.content[i];
    let res = null as any;

    if (row) {
      res = {};
      row.forEach((c, idx) => {
        const fieldName = this.fields[idx];
        if (fieldName) {
          res[fieldName] = this.castData(c, idx);
        }
      });
    }

    return res;
  }

  queryByField(fieldName: string, field: any): any;
  queryByField(idx: number, field: any): any;
  queryByField(fieldName: string | number, field: any) {
    const colIdx = typeof fieldName === "number" ? fieldName : this.fields.indexOf(fieldName);
    const castField = typeof field === "string" ? this.castData(field, colIdx) : field;
    const idxs = [];

    for (let i = 0; i < this.content.length; i++) {
      const idx = this.content.findIndex((c, ridx) => {
        return this.castData(c[colIdx], colIdx) === castField;
      });

      if (idx !== -1) {
        idxs.push(idx);
      }
    }

    return idxs.map(idx => {
      return this.queryByRow(idx);
    });
  }

  queryOneByField(fieldName: string, field: any): any;
  queryOneByField(idx: number, field: any): any;
  queryOneByField(fieldName: string | number, field: any) {
    const colIdx = typeof fieldName === "number" ? fieldName : this.fields.indexOf(fieldName);
    const castField = typeof field === "string" ? this.castData(field, colIdx) : field;
    const idx = this.content.findIndex((c, ridx) => {
      return this.castData(c[colIdx], colIdx) === castField;
    });

    return this.queryByRow(idx);
  }

  queryByID(id: string) {
    const idIdx = this.fields.findIndex(field => {
      return ["id", "ID", "Id"].indexOf(field) !== -1;
    });

    return this.queryByField(idIdx, id);
  }

  queryOneByID(id: string) {
    const idIdx = this.fields.findIndex(field => {
      return ["id", "ID", "Id"].indexOf(field) !== -1;
    });

    return this.queryOneByField(idIdx, id);
  }

  queryIn(field: string, values: any[]) {
    const fieldIdx = this._getFieldIdx(field);
    const res = [];

    this.content.forEach((item, idx) => {
      const data = this.getDataByIdx(idx, fieldIdx);
      if (values.indexOf(data) !== -1) {
        res.push(this.queryByRow(idx));
      }
    });

    return res;
  }

  queryOneIn(field: string, values: any[]) {
    const fieldIdx = this._getFieldIdx(field);
    const content = this.content;
    let res = null;

    for (let i = 0; i < content.length; i++) {
      const data = this.getDataByIdx(i, fieldIdx);
      if (values.indexOf(data) !== -1) {
        res = data;
        break;
      }
    }

    return res;
  }

  batchQuery(condition: { [k: string]: any | any[] }) {
    const keys = Object.keys(condition);
    const res = [];
    let tmpRes = null;

    keys.forEach((k, idx) => {
      const v = condition[k];
      if (v instanceof Array) {
        tmpRes = this.queryOneIn(k, v);
      } else {
        tmpRes = this.queryOneByField(k, v);
      }

      if (tmpRes) {
        res.push(tmpRes);
      }
    });

    return res;
  }

  queryAll() {
    const res = [];
    for (let i = 0; i < this.content.length; i++) {
      res.push(this.queryByRow(i));
    }

    return res;
  }

  toText(delimiter: string = ",", lineDelimit: string = "\n") {
    const res = [] as string[];

    res.push(this.comments.join(delimiter));
    res.push(this.casts.join(delimiter));
    res.push(this.fields.join(delimiter));

    this.content.forEach(line => {
      const cells = [] as string[];

      line.forEach(c => {
        cells.push(c || delimiter);
      });

      res.push(cells.join(delimiter));
    });

    return res.join(lineDelimit);
  }
}

export default class CSVParser {
  private static _Instance: CSVParser;
  private parseOpts = csvParseOpts;

  public static get Instance() {
    return CSVParser._Instance || new CSVParser();
  }

  public static set Instance(v: CSVParser) {
    throw new Error("can't set instance prop");
  }

  constructor() {
    if (CSVParser._Instance) {
      throw new Error("CSVParser is a singleton");
    }

    CSVParser._Instance = this;
  }

  private parseLine(str: string, opts: typeof csvParseOpts) {
    let pos = 0;
    let start = 0;
    let inQuaot = false;
    const len = str.length;
    const lineData = [] as string[];

    function pushData(start: number, end: number) {
      // 去空格，去引号
      const res = str
        .slice(start, end)
        .trim()
        .replace(/^"(.*)"$/, "$1");
      lineData.push(res);
    }

    while (pos < len) {
      // 引号内
      if (str[pos] === '"') {
        // 处理非字符串双引号
        if (pos === 0 || str[pos - 1] !== "\\") {
          inQuaot = !inQuaot;

          if (inQuaot) {
            start = pos;
            pos = str.indexOf('"', pos + 1);
            continue;
          }
        } else {
          pos = str.indexOf('"', pos + 1);
          continue;
        }

        // 分隔符
      } else if (str[pos] === opts.delimiter) {
        lineData.push("");
        pos++;
        continue;
      } else if (str[pos]) {
        start = pos;
      }

      // 定位到 下一个分隔符
      pos = str.indexOf(opts.delimiter, pos + 1);
      // 找不到下一个分隔符或者解析”字符串数据“异常
      if (pos === -1) {
        if (inQuaot) {
          console.error("数据异常", str, "\n", lineData.slice());
        }

        // 没取完的数据需要取出
        pushData(start, len);
        break;
      } else {
        pushData(start, pos);
      }

      pos++;
    }

    return lineData;
  }

  parse(text: string, options?: typeof csvParseOpts) {
    const opts = Object.assign({}, this.parseOpts, options);
    let lines = text.split(opts.lineDelimit);

    let comments: string[] = [];
    let casts: CSVCast[] = [];
    let fields: string[] = [];
    let content: Array<string[]> = [];

    if (opts.header) {
      comments = this.parseLine(lines[0], opts);
      casts = this.parseLine(lines[1], opts) as CSVCast[];
      fields = this.parseLine(lines[2], opts);
      lines = lines.slice(3);
    }

    for (let i = 0; i < lines.length; i++) {
      const data = this.parseLine(lines[i], opts);
      if (data.length) {
        content.push(data);
      }
    }

    return new CSVData(comments, casts, fields, content);
  }
}
