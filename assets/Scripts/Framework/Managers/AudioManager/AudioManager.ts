import { _decorator, AudioClip, AudioSource, Component, Node } from "cc";
import Storage from "../../Utils/Storage";
import { ResManager } from "../ResManager/ResManager";
import { FrameworkConfig } from "../../FrameworkConfig";

const { ccclass, property } = _decorator;

const defaultConf = {
  volume: 1,
};

export type AudioClipInfo = {
  clip: AudioClip;
  name: string;
  volume: number;
  loop: boolean;
};

@ccclass("AudioManager")
export class AudioManager extends Component {
  public static Instance: AudioManager;

  private static MAX_SOUND = 8;

  private _musicMap: Map<string, AudioClipInfo> = new Map();
  private _soundMap: Map<string, AudioClipInfo> = new Map();

  private _soundAs: AudioSource[] = [];
  private _bgMusic: AudioSource = null as unknown as AudioSource;
  private _soundIdx = 0;

  private _isMusicMute = false;
  private _isSoundMute = false;
  private _volume = 1;

  protected onLoad(): void {
    if (!AudioManager.Instance) {
      AudioManager.Instance = this;
    } else {
      this.destroy();
      return;
    }

    for (let i = 0; i < AudioManager.MAX_SOUND; i++) {
      let as = this.node.addComponent(AudioSource);
      this._soundAs.push(as);
    }

    this._bgMusic = this.addComponent(AudioSource)!;
  }

  syncSetting() {
    const setting = Storage.Instance.getData("setting");
    if (!setting.volume) {
      setting.volume = defaultConf.volume;
    }

    this._volume = setting.volume;
  }

  private _setupAudio(
    map: Map<string, AudioClipInfo>,
    name: string,
    clip: AudioClip,
    volume: number = this._volume,
    loop: boolean = false,
  ) {
    if (map.get(name) && FrameworkConfig.Instance.data.isDebugOpen) {
      console.error(`${name} has been overload.`, map.get(name));
    }

    map.set(name, {
      clip,
      volume,
      loop,
      name,
    });
  }

  private _loadAudioByPath(
    map: Map<string, AudioClipInfo>,
    abName: string,
    path: string,
    name: string,
    volume: number,
    loop: boolean = false,
  ) {
    if (!path.endsWith("/")) {
      path = path + "/";
    }

    const audio = ResManager.Instance.getAsset(abName, path + name) as AudioClip;
    this._setupAudio(map, name, audio, volume, loop);
  }

  private _getAudioSource() {
    this._soundIdx++;
    if (this._soundIdx >= AudioManager.MAX_SOUND) {
      this._soundIdx = 0;
    }

    return this._soundAs[this._soundIdx];
  }

  loadMusicByPath(abName: string, path: string, name: string, volume: number, loop: boolean = false) {
    this._loadAudioByPath(this._musicMap, abName, path, name, volume, loop);
  }

  setupMusic(name: string, clip: AudioClip, volume: number = this._volume, loop: boolean = false) {
    this._setupAudio(this._musicMap, name, clip, volume, loop);
  }

  loadSoundByPath(abName: string, path: string, name: string, volume: number, loop: boolean = false) {
    this._loadAudioByPath(this._musicMap, abName, path, name, volume, loop);
  }

  setupSoud(name: string, clip: AudioClip, volume: number = this._volume, loop: boolean = false) {
    this._setupAudio(this._soundMap, name, clip, volume, loop);
  }

  playBgMusic(clip: AudioClip, isLoop: boolean = true) {
    this._bgMusic.clip = clip;
    this._bgMusic.loop = isLoop;
    this._bgMusic.play();
  }

  stopBgMusic() {
    this._bgMusic.stop();
  }

  playSound(name: string) {
    const as = this._getAudioSource();
    const audioInfo = this._soundMap.get(name);

    if (!audioInfo) {
      console.error("soud not exist", name);
      return;
    }
    as.volume = !this._isSoundMute ? audioInfo.volume : 0;
    as.loop = audioInfo.loop;
    as.clip = audioInfo.clip;
    as.play();
    return as;
  }

  playMusic(name: string) {
    const audioInfo = this._musicMap.get(name);

    this._bgMusic.volume = !this._isMusicMute ? audioInfo.volume : 0;
    this._bgMusic.loop = audioInfo.loop;
    this._bgMusic.clip = audioInfo.clip;
    this._bgMusic.play();
  }

  setMusicMute(is: boolean) {
    this._isMusicMute = is;
    if (!is) {
      this._bgMusic.volume = 0;
      return;
    }

    const clip = this._bgMusic.clip;
    for (const [k, audioInfo] of this._musicMap) {
      if (clip === audioInfo.clip) {
        this._bgMusic.volume = audioInfo.volume;
      }
    }
  }

  setSoundMute(is: boolean) {
    this._isSoundMute = is;

    for (let i = 0; i < this._soundAs.length; i++) {
      const sound = this._soundAs[i];
      if (is) {
        sound.volume = 0;
        continue;
      }

      for (const [k, audioInfo] of this._soundMap) {
        if (sound.clip === audioInfo.clip) {
          sound.volume = audioInfo.volume;
        }
      }
    }
  }
}
