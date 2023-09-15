import { WebGLEngine } from "@galacean/engine";
import {
  AssetPromise,
  Loader,
  LoadItem,
  resourceLoader,
  ResourceManager
} from "@galacean/engine";
import { RequestConfig } from "@galacean/engine-core/types/asset/request";
import { GlobalAudioContext } from "./global";
import { Sound } from "./Sound";
import { AudioContentRestorer } from "./SoundContentStore";
import { SoundPlayer } from "./SoundPlayer";

let hasAddListener = false;
function listener(e: Event) {
  SoundPlayer.triggerUserGesture();
  e.target!.removeEventListener("pointerdown", listener);
}

@resourceLoader("audio", ["mp3", "wav", "ogg"])
class SoundLoader extends Loader<Sound> {

  override load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<Sound> {
    if (!hasAddListener) {
      hasAddListener = true;
      ((resourceManager.engine as WebGLEngine).canvas._webCanvas as HTMLCanvasElement).addEventListener("pointerdown", listener);
    }
    return new AssetPromise((resolve, reject) => {
      const url = item.url!;
      const requestConfig = <RequestConfig>{
        ...item,
        type: "arraybuffer"
      };
      this.request<ArrayBuffer>(url, requestConfig)
        .then((buffer) => {
          return GlobalAudioContext.decodeAudioData(buffer);
        }).then((buffer) => {
          const sound = new Sound(resourceManager.engine);
          sound.setAudioSource(buffer);
          if (url.indexOf("data:") !== 0) {
            const index = url.lastIndexOf("/");
            sound.name = url.substring(index + 1);
          }

          resourceManager.addContentRestorer(new AudioContentRestorer(sound, url, requestConfig));
          resolve(sound);
        })
        .catch((e) => {
          reject!(e);
        });
    });
  }
}
