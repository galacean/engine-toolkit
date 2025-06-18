import { WebGLEngine, type WebGLEngineConfiguration } from "@galacean/engine";
import { makeDecorator, useEffect } from 'storybook/preview-api';

export interface CanvasOptions {
  width?: number;
  height?: number;
  engineOptions?: Omit<WebGLEngineConfiguration, 'canvas'>
}

export const withCanvas = makeDecorator({
  name: 'withCanvas',
  parameterName: 'canvas',
  wrapper: (storyFn, context, { parameters = {} }) => {
    const container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    const canvasOptions = context.parameters.canvas || {};
    
    const enginePromise = WebGLEngine.create({ 
      canvas: canvas, 
      graphicDeviceOptions: {
        
      },
      ...(canvasOptions.engineOptions || {}) 
    });
    
    context.getEngine = () => {
      return enginePromise;
    };
    
    useEffect(() => {
      return () => {
        enginePromise.then(engine => {
          engine.destroy();
        });
      };
    }, []);
    
    const story = storyFn(context);
    if (typeof story === 'string') {
      const div = document.createElement('div');
      div.innerHTML = story;
      container.appendChild(div);
    } else if (story instanceof HTMLElement) {
      container.appendChild(story);
    }
    
    return container;
  }
});
