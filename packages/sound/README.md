# Sound

A sound library for playing audio files

## Features
- loop: support changing loop; 
- volume: support changing volume;
- speed: support changing playbackRate;

## npm

The `Sound` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-sound
```

This will allow you to import tween entirely using:

```javascript
import * as SOUND from "@galacean/engine-toolkit-sound";
```

or individual classes using:

```javascript
import { SoundPlayer } from "@galacean/engine-toolkit-sound";
```

## How to use
Step 1: Loading file
```typescript
await engine.resourceManager.load([{
    url: "./test.mp3",
    type: "audio",
}]);
// or just use url string. file suffix could be mp3, wav or ogg
await engine.resourceManager.load(["./test.mp3"]);
```
Step 2: Add sound player component
```typescript
const player = entity.addComponent(SoundPlayer);
player.sound = engine.resourceManager.getFromCache("./test.mp3");
```
Step 3: You can set some options and play sound
```typescript
player.volume = 0.5;
player.playbackRate = 0.5;
player.loop = true;
player.play();
```

### Attention: Make sure user should have already made a gesture before playing a sound.
## Links

- [Repository](https://github.com/galacean/engine-toolkit)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
