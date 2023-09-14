# Tween

An animation library for build tween animations

## Features
- easing: builtin easing and custom easing function; 
- chain: can play several tween animations one after another;
- fillMode: support fillMode just like css-fillMode behaviour;

## npm

The `Tween` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-tween
```

This will allow you to import tween entirely using:

```javascript
import * as TWEEN from "@galacean/engine-toolkit-tween";
```

or individual classes using:

```javascript
import { Tween } from "@galacean/engine-toolkit-tween";
```

## demo
```typescript
const tween = entity.addComponent<Tween<Vector3>>(Tween);
tween.target = entity.transform.position; // change position
tween.to = new Vector3(4, 0, 0);
tween.from = new Vector3(-4, 0, 0);
tween.delay = 1; // delay 1 second
tween.duration = 2; // 2 seconds
tween.loop = 3; // loop 3 times so it will animate 4 times
tween.easing = Easing.BackInOut; // or just use 'BackInOut' string

const tween2 = entity.addComponent<Tween<Color>>(Tween);
tween2.target = material.baseColor; // change color
tween2.to = new Color(0, 0, 1);
tween2.from = new Color(1, 0, 0);
tween2.easing = (a: number) => return a * a; // custom easing function

const tween3 = entity.addComponent<Tween<Vector3>>(Tween);
tween3.target = entity.transform.rotation; // change rotation
tween3.to = new Vector3(0, 0, 0);
tween3.from = new Vector3(90, 90, 180);

tween.chain(tween2, tween3).play(); // you can chain as many tween as you want. tween2 and tween3 will play at the same time when tween ended.

tween.play();
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
