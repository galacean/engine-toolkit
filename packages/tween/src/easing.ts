export type EasingFunc = (p: number) => number;
export type EasingName = keyof typeof Easing;
export type EasingType = EasingName | EasingFunc | undefined;

export const Easing = {
    BackIn: (p: number): number => {
        const s = 1.70158;
        return p === 1 ? 1 : p * p * ((s + 1) * p - s);
    },
    BackInOut: (p: number): number => {
        const s = 1.70158 * 1.525;

        if ((p *= 2) < 1) {
            return 0.5 * (p * p * ((s + 1) * p - s));
        }

        p -= 2;

        return 0.5 * (p * p * ((s + 1) * p + s) + 2);
    },
    BackOut: (p: number): number => {
        const s = 1.70158;

        return p === 0 ? 0 : --p * p * ((s + 1) * p + s) + 1;
    },
    BounceIn: (p: number): number => {
        return 1 - Easing.BounceOut(1 - p);
    },
    BounceInOut: (p: number): number => {
        if (p < 0.5) {
            return Easing.BounceIn(p * 2) * 0.5;
        }

        return Easing.BounceOut(p * 2 - 1) * 0.5 + 0.5;
    },
    BounceOut: (p: number): number => {
        if (p < 1 / 2.75) {
            return 7.5625 * p * p;
        } else if (p < 2 / 2.75) {
            return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
        } else if (p < 2.5 / 2.75) {
            return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
        } else {
            return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
        }
    },
    CircularIn: (p: number): number => {
        return 1 - Math.sqrt(1 - p * p);
    },
    CircularInOut: (p: number): number => {
        if ((p *= 2) < 1) {
            return -0.5 * (Math.sqrt(1 - p * p) - 1);
        }
        p -= 2;

        return 0.5 * (Math.sqrt(1 - p * p) + 1);
    },
    CircularOut: (p: number): number => {
        return Math.sqrt(1 - --p * p);
    },
    CubicIn: (p: number): number => {
        return p * p * p;
    },
    CubicInOut: (p: number): number => {
        if ((p *= 2) < 1) {
            return 0.5 * p * p * p;
        }

        p -= 2;

        return 0.5 * (p * p * p + 2);
    },
    CubicOut: (p: number): number => {
        return --p * p * p + 1;
    },
    ElasticIn: (p: number): number => {
        if (p === 0 || p === 1) {
            return p;
        }

        return -Math.pow(2, 10 * (p - 1)) * Math.sin((p - 1.1) * 5 * Math.PI);
    },
    ElasticInOut: (p: number): number => {
        if (p === 0 || p === 1) {
            return p;
        }
    
        p *= 2;
    
        if (p < 1) {
            return -0.5 * Math.pow(2, 10 * (p - 1)) * Math.sin((p - 1.1) * 5 * Math.PI);
        }
    
        return 0.5 * Math.pow(2, -10 * (p - 1)) * Math.sin((p - 1.1) * 5 * Math.PI) + 1;
    },
    ElasticOut: (p: number): number => {
        if (p === 0 || p === 1) {
            return p;
        }
    
        return Math.pow(2, -10 * p) * Math.sin((p - 0.1) * 5 * Math.PI) + 1;
    },
    ExponentialIn: (p: number): number => {
        return p === 0 ? 0 : Math.pow(1024, p - 1);
    },
    ExponentialInOut: (p: number): number => {
        if (p === 0 || p === 1) {
            return p;
        }
    
        if ((p *= 2) < 1) {
            return 0.5 * Math.pow(1024, p - 1);
        }
    
        return 0.5 * (-Math.pow(2, -10 * (p - 1)) + 2);
    },
    ExponentialOut: (p: number): number => {
        return p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    },
    Linear: (p: number) => p,
    QuadraticIn: (p: number): number => {
        return p * p;
    },
    QuadraticInOut: (p: number): number => {
        if ((p *= 2) < 1) {
            return 0.5 * p * p;
        }
    
        return -0.5 * (--p * (p - 2) - 1);
    },
    QuadraticOut: (p: number): number => {
        return p * (2 - p);
    },
    QuarticIn: (p: number): number => {
        return p * p * p * p;
    },
    QuarticInOut: (p: number): number => {
        if ((p *= 2) < 1) {
            return 0.5 * p * p * p * p;
        }
        p -= 2;
    
        return -0.5 * (p * p * p * p - 2);
    },
    QuarticOut: (p: number): number => {
        return 1 - --p * p * p * p;
    },
    QuinticIn: (p: number): number => {
        return p * p * p * p * p;
    },
    QuinticInOut: (p: number): number => {
        if ((p *= 2) < 1) {
            return 0.5 * p * p * p * p * p;
        }
        p -= 2;
    
        return 0.5 * (p * p * p * p * p + 2);
    },
    QuinticOut: (p: number): number => {
        return --p * p * p * p * p + 1;
    },
    SinusoidalIn: (p: number): number => {
        return 1 - Math.sin(((1.0 - p) * Math.PI) / 2);
    },
    SinusoidalInOut: (p: number): number => {
        return 0.5 * (1 - Math.sin(Math.PI * (0.5 - p)));
    },
    SinusoidalOut: (p: number): number => {
        return Math.sin((p * Math.PI) / 2);
    }
}
