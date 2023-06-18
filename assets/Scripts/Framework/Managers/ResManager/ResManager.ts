import { Constructor, url } from "cc";
import { AssetManager } from "cc";
import { assetManager } from "cc";
import { Asset } from "cc";
import { _decorator, Component, Node, resources } from "cc";
const { ccclass } = _decorator;

export type ResPathInfo<T extends Asset> = {
  urls: string[];
  type: Constructor<T>;
};

export type ReqResInfo<T extends Asset> = {
  [k: string]: ResPathInfo<T>[] | Constructor<T>;
};

export type ProgressFn = (cur: number, total: number) => void;
export type CompleteFn = () => void;

@ccclass("ResManager")
export class ResManager extends Component {
  public static Instance: ResManager;
  private totalAb: number = 0;
  private curAb: number = 0;

  private now: number = 0;
  private total: number = 0;

  onLoad(): void {
    if (!ResManager.Instance) {
      ResManager.Instance = this;
    } else {
      this.destroy();
      return;
    }
  }

  private loadAndRef(
    ab: AssetManager.Bundle,
    url: string,
    assetType: any,
    progress?: ProgressFn,
    complete?: CompleteFn,
  ): void {
    ab.load(url, assetType, (err: any, asset: Asset) => {
      if (err) {
        console.error("load assets: ", err);
        return;
      }

      asset.addRef();

      this.now++;
      if (progress) {
        progress(this.now, this.total);
      }
      if (this.now >= this.total) {
        if (complete) {
          complete();
        }
      }
    });
  }

  private loadAssetsInUrls(
    ab: AssetManager.Bundle,
    assetType: any,
    urls: Array<string>,
    progress?: ProgressFn,
    complete?: CompleteFn,
  ): void {
    for (let i = 0; i < urls.length; i++) {
      this.loadAndRef(ab, urls[i], assetType, progress, complete);
    }
  }

  private releaseAssetsInUrls(abBundle: AssetManager.Bundle, typeAsset: any, urls: Array<string>): void {
    for (let i = 0; i < urls.length; i++) {
      let asset: Asset = abBundle.get(urls[i]) as Asset;
      if (!asset) {
        continue;
      }

      asset.decRef(true);
    }
  }

  releaseResPkg<T extends Asset>(resInfo: ReqResInfo<T>) {
    for (let key in resInfo) {
      let abBundle = assetManager.getBundle(key);
      if (!abBundle) {
        continue;
      }

      if (resInfo[key] instanceof Array) {
        const pkgInfo = resInfo[key] as ResPathInfo<T>[];
        for (let i = 0; i < pkgInfo.length; i++) {
          this.releaseAssetsInUrls(abBundle, pkgInfo[i].type, pkgInfo[i].urls);
        }
      } else {
        let typeAsset = resInfo[key];
        let infos = abBundle.getDirWithPath("/");
        let urls: any = [];
        for (let i = 0; i < infos.length; i++) {
          urls.push(infos[i].path);
        }
        this.releaseAssetsInUrls(abBundle, typeAsset, urls);
      }
    }
  }

  preLoadAssetsInAB<T extends Asset>(resInfo: ReqResInfo<T>, progress?: ProgressFn, completed?: CompleteFn) {
    for (let k in resInfo) {
      let ab = assetManager.getBundle(k)!;
      if (!ab) {
        console.error("ab not exist", ab);
        continue;
      }

      if (resInfo[k] instanceof Array) {
        const res = resInfo[k] as ResPathInfo<T>[];
        for (let i = 0; i < res.length; i++) {
          this.loadAssetsInUrls(ab, res[i].type, res[i].urls, progress, completed);
        }
      } else {
        let assetType = resInfo[k];
        let infos = ab.getDirWithPath("/");
        let urls: any = [];
        for (let i = 0; i < infos.length; i++) {
          urls.push(infos[i].path);
        }

        this.loadAssetsInUrls(ab, assetType, urls, progress, completed);
      }
    }
  }

  preloadResPkg<T extends Asset>(resInfo: ReqResInfo<T>, progress?: ProgressFn, completed?: CompleteFn) {
    const abNames = Object.keys(resInfo);
    this.now = 0;
    this.total = 0;
    this.curAb = 0;
    this.totalAb = abNames.length;

    abNames.forEach(abName => {
      // 计算资源数 （直接请求bundle的，需要获取bundle后才能累加）
      const reqBundle = resInfo[abName];
      if (reqBundle instanceof Array) {
        for (let i = 0; i < reqBundle.length; i++) {
          this.total += reqBundle[i].urls.length;
        }
      }

      assetManager.loadBundle(abName, (err, bundle: AssetManager.Bundle) => {
        if (err) {
          console.error("load bundle error", err);
          return;
        }

        this.curAb++;

        // 获取bundle 内的资源数
        if (!(reqBundle instanceof Array)) {
          let infos = bundle.getDirWithPath("/");
          // 生成完整bundle 的目录
          resInfo[abName] = [
            {
              type: reqBundle,
              urls: infos.map(info => info.path),
            },
          ];
          this.total += infos.length;
        }

        // bundle 加载完就请求实际资源
        if (this.curAb >= this.totalAb) {
          this.preLoadAssetsInAB(resInfo, progress, completed);
        }
      });
    });
  }

  preloadAsset(abName: string, url: string, typeClass: any, endFunc: Function): void {
    assetManager.loadBundle(abName, (err, abBundle: AssetManager.Bundle) => {
      if (err) {
        console.log(err);
        return;
      }

      abBundle.load(url, typeClass, (err, asset: Asset) => {
        if (err) {
          console.log(err);
          return;
        }

        if (endFunc) {
          endFunc();
        }
      });
    });
  }

  releaseAsset(abName: string, url: string): void {
    let abBundle = assetManager.getBundle(abName);
    if (!abBundle) {
      return;
    }

    abBundle.release(url);
  }

  getAllUrlsFromAb(abName: string) {
    const abBundle = assetManager.getBundle(abName);
    const urls = [] as string[];

    if (abBundle) {
      abBundle.getDirWithPath("/").forEach(asset => {
        urls.push(asset.path);
      });
    }

    return urls;
  }

  getAssets(abName: string, url) {
    let abBundle = assetManager.getBundle(abName);

    if (!abBundle) {
      return null;
    }
    const infos = abBundle.getDirWithPath(url);

    return infos.map(info => {
      return this.getAsset(abName, info.path);
    });
  }
  
  // 同步接口, 前面已经加载好了的资源;
  getAsset(abName: string, url: string) {
    let abBundle = assetManager.getBundle(abName);

    if (!abBundle) {
      return null;
    }

    return abBundle.get(url);
  }
}
