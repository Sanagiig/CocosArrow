import { Vec3 } from "cc";

export type WarningController = {
  setup: (startPos: Vec3, endPos: Vec3, scale: number) => void;
  display: () => void;
  hide: () => void;
  recycle: () => void;
};
