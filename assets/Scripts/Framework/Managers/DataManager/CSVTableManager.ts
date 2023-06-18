import { _decorator, Component, Node } from "cc";
import CSVParser, { CSVData } from "../../Utils/CSVParser";
const { ccclass, property } = _decorator;

@ccclass("CSVDataManager")
export class CSVTableManager {
  private _dataMap: Map<string, CSVData> = new Map();

  private genParseCSVData(data: string) {
    return CSVParser.Instance.parse(data);
  }

  addTable(name: string, data: string | CSVData) {
    let d = this._dataMap.get(name);
    if (d) {
      return console.error("csvData ", name, "已存在");
    }

    this._dataMap.set(name, typeof data === "string" ? this.genParseCSVData(data) : data);
  }

  updateTable(name: string, data: string | CSVData) {
    let d = this._dataMap.get(name);
    if (!d) {
      return console.error("csvData ", name, "不存在");
    }

    this._dataMap.set(name, typeof data === "string" ? this.genParseCSVData(data) : data);
  }

  getTable(name: string) {
    return this._dataMap.get(name);
  }

  deleteTable(name: string) {
    this._dataMap.delete(name);
  }

  getDataByIdx(tbName: string, i: number, j: number) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.getDataByIdx(i, j);
    }
  }

  queryCol(tbName: string, i: number) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryCol(i);
    }
  }

  queryRow(tbName: string, i: number) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryRow(i);
    }
  }

  queryByRow(tbName: string, i: number) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryByRow(i);
    }
  }

  queryByField(tbName: string, field: string, fieldVal: any) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryByField(field, fieldVal);
    }
  }

  queryOneByField(tbName: string, fieldName: string, field: any) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryOneByField(fieldName, field);
    }
  }

  queryByID(tbName: string, id: string) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryByID(id);
    }
  }

  queryOneByID(tbName: string, id: string) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryOneByID(id);
    }
  }

  queryIn(tbName: string, field: string, values: any[]) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryIn(field, values);
    }
  }

  queryOneIn(tbName: string, field: string, values: any[]) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryOneIn(field, values);
    }
  }

  batchQuery(tbName: string, condition: { [k: string]: any | any[] }) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.batchQuery(condition);
    }
  }

  queryAll(tbName: string) {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.queryAll();
    }
  }

  toText(tbName: string, delimiter: string = ",", lineDelimit: string = "\n") {
    const tb = this.getTable(tbName);
    if (tb) {
      return tb.toText(delimiter, lineDelimit);
    }
  }
}
