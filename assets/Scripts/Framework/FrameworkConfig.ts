export type FramworkConfigType = {
  isDebugOpen: boolean;
};

const defaultConf = {
  isDebugOpen: true,
} as FramworkConfigType;

export class FrameworkConfig {
  private static _Instance: FrameworkConfig;

  data = {} as FramworkConfigType;

  public static get Instance() {
    return FrameworkConfig._Instance || new FrameworkConfig();
  }

  public static set Instance(v: FrameworkConfig) {
    throw new Error("can't set instance prop");
  }

  constructor() {
    if (FrameworkConfig._Instance) {
      throw new Error("FrameworkConfig is a singleton");
    }

    FrameworkConfig._Instance = this;
    Object.assign(this.data, defaultConf);
  }

  get(k: keyof FramworkConfigType) {
    return this.data[k];
  }

  set<K extends keyof FramworkConfigType>(k: K, v: FramworkConfigType[K]) {
    this.data[k] = v;
  }
}
