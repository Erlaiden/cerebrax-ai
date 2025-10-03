import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

type Backend = 'rn-webgl' | 'cpu';
type PredictOutput = { logits: number[]; probs: number[]; labelIndex: number };

class AIEngine {
  private static _i: AIEngine;
  private _inited = false;
  private _backend: Backend = 'cpu';

  static get instance() { return this._i ?? (this._i = new AIEngine()); }
  get backend() { return this._backend; }

  async init(): Promise<{ backend: Backend }> {
    if (this._inited) return { backend: this._backend };
    await tf.ready();
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await tf.setBackend('rn-webgl');
        await tf.ready();
        this._backend = 'rn-webgl';
      } else {
        await tf.setBackend('cpu');
        await tf.ready();
        this._backend = 'cpu';
      }
    } catch {
      await tf.setBackend('cpu');
      await tf.ready();
      this._backend = 'cpu';
    }
    this._inited = true;
    return { backend: this._backend };
  }

  async predict(input: number[]): Promise<PredictOutput> {
    if (!this._inited) await this.init();
    return tf.tidy(() => {
      const inLen = input.length;
      const W = tf.randomUniform([inLen, 3], -0.1, 0.1, 'float32');
      const b = tf.tensor1d([0, 0, 0], 'float32');
      const x = tf.tensor2d(input, [1, inLen], 'float32');
      const logitsT = tf.add(tf.matMul(x, W), b);   // [1,3]
      const probsT = tf.softmax(logitsT);
      const logits = Array.from(logitsT.dataSync());
      const probs = Array.from(probsT.dataSync());
      const labelIndex = probs.indexOf(Math.max(...probs));
      return { logits, probs, labelIndex };
    });
  }
}

export default AIEngine.instance;
