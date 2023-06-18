import { _decorator, Component, Node, TextAsset } from "cc";
/// @ts-ignore
import protobuffer from "protobufjs/dist/protobuf.js";
import protobuf from "protobufjs";

const { ccclass, property } = _decorator;

@ccclass("ProtoManager")
export class ProtoManager extends Component {
  public static Instance: ProtoManager;

  private pbTextAsset: TextAsset | null = null;
  private pb: protobuf.IParserResult | null = null;
  protected onLoad(): void {
    if (!ProtoManager.Instance) {
      ProtoManager.Instance = this;
    } else {
      this.destroy();
      return;
    }
  }

  init(pbText: TextAsset | null) {
    this.pbTextAsset = pbText;
    if (pbText) {
      this.pb = (protobuffer as typeof protobuf).parse(this.pbTextAsset!.text);
    }
  }

  serializeMsg(msgName: string, msgBody: any) {
    const rs = this.pb?.root.lookupType(msgName);
    const msg = rs?.create(msgBody)!;
    const buf = rs?.encode(msg).finish();

    return buf;
  }

  deserializeMsg(msgName: string, msgBody: Uint8Array) {
    const rs = this.pb?.root.lookupType(msgName);
    const msg = rs?.decode(msgBody)!;
    return msg;
  }
}
