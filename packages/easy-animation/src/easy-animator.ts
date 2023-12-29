import {
  AnimationClip,
  Animator,
  AnimatorControllerLayer,
  AnimatorLayerBlendingMode,
  AnimatorStateMachine,
  AnimatorStateTransition,
  Entity
} from "@galacean/engine";

function getAnimations(model: Entity, layer = 0) {
  const clips: AnimationClip[] = [];
  const animator = model.getComponent(Animator);
  if (!animator) return clips;
  const animatorController = animator.animatorController.layers[layer];
  animatorController.stateMachine.states.forEach((state) => {
    clips.push(state.clip);
  });
  return clips;
}

/**
 * 在播放动画模型实体的动画组件上加多层 layer
 *
 * 目前有多少个动画就有多少个 layer
 * @param model 要播放动画的模型实体
 * @param blendingMode 混合模式，默认覆盖模式
 * @returns animator 动画组件
 * @returns animationNames 模型上所有的动画名
 */
export function addAnimatorLayer(model: Entity, blendingMode = AnimatorLayerBlendingMode.Override) {
  const animator = model.getComponent(Animator);
  if (!animator) {
    console.warn("easy-animator: 模型没有动画组件");
    return;
  }

  const animations = getAnimations(model);
  const animationNames = animations.map((clip, index) => {
    const animatorStateMachine = new AnimatorStateMachine();
    const newState = animatorStateMachine.addState(clip.name);
    newState.clip = clip;
    const additiveLayer = new AnimatorControllerLayer(`additiveLayer-${index}`);
    additiveLayer.stateMachine = animatorStateMachine;
    additiveLayer.blendingMode = blendingMode;
    animator.animatorController.addLayer(additiveLayer);

    return clip.name;
  });

  return { animator, animationNames };
}

/**
 * 同一个 layer 上的多个动画连续播放
 * @param animator 播放动画组件实例
 * @param transitions 动画播放顺序数组
 * @param layerIndex 动画 layer 层级
 */
export function multiAnimationsTransition({
  animator,
  transitions,
  layerIndex
}: {
  animator: Animator;
  transitions: string[];
  layerIndex: number;
}) {
  if (!transitions.length) {
    console.warn("easy-animator: transitions 为空数组");
    return;
  }

  const layer = animator.animatorController.layers[layerIndex];
  const { stateMachine } = layer;

  const states = transitions.map((name, index) => {
    const aniName = `${name}-${index}`;
    const state = stateMachine.addState(aniName);
    state.clip = animator.findAnimatorState(name).clip;

    return {
      name: aniName,
      state,
      transition: new AnimatorStateTransition()
    };
  });

  for (let i = 0, len = states.length; i < len; i++) {
    states[i].transition.duration = 0;
    states[i].transition.offset = 0;
    states[i].transition.exitTime = 1;
    states[i].transition.destinationState = i === len - 1 ? states[0].state : states[i + 1].state;
    states[i].state.addTransition(states[i].transition);
  }

  animator.play(states[0].name, layerIndex);
}
