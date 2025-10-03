// src/ai/AIEngine.ts
// Универсальный ИИ-слой:
//  - В Expo Go: TensorFlow.js (@tensorflow/tfjs-react-native), backend rn-webgl или cpu
//  - В будущем при сборке APK: переключение на TFLite/NNAPI без изменения публичного API

import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

type Backend = 'rn-webgl' | 'cpu' | 'tflite-nnapi';
type PredictOutput = { logits: number[]; probs: number[]; labelIndex: number };

class AIEngine {
  private static _instance: AIEngine;
  private _initialized = false;
  private _backend: Backend = 'cpu';

  // Заглушка под будущий TFLite. Сейчас всегда false, потому что Expo Go не поддерживает native-модули.
  private get useTFLite(): boolean {
    return false; // сменим на true только в нативной сборке (prebuild + tflite)
  }

  static get instance(): AIEngine {
    if (!AIEngine._instance) AIEngine._instance = new AIEngine();
    return AIEngine._instance;
  }

  get backend(): Backend {
    return this._backend;
  }

  /** Инициализация движка. Выбираем лучший доступный backend. */
  async init(): Promise<{ backend: Backend }> {
    if (this._initialized) return { backend: this._backend };

    if (this.useTFLite) {
      // место для TFLite/NNAPI в нативной сборке
      this._backend = 'tflite-nnapi';
      this._initialized = true;
      return { backend: this._backend };
    }

    // Expo Go: tfjs-react-native
    // Пытаемся rn-webgl, если упадёт — откатываемся на cpu
    try {
      await tf.ready();
      const canWebGL = Platform.OS === 'android' || Platform.OS === 'ios';
      if (canWebGL) {
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

    this._initialized = true;
    return { backend: this._backend };
  }

  /**
   * Быстрый предикт без внешней модели.
   * Демонстрационный линейный классификатор: x -> softmax(Wx + b) на 3 класса.
   * Нужен, чтобы проверить, что tfjs реально работает на устройстве.
   */
  async predict(input: number[]): Promise<PredictOutput> {
    if (!this._initialized) await this.init();
    if (this.useTFLite) {
      // здесь будет вызов TFLite NNAPI в нативной сборке
      throw new Error('TFLite path is not available in Expo Go');
    }

    // tfjs путь
    return tf.tidy(() => {
      const inLen = input.length;
      // Фиксируем размеры весов под вход длиной inLen и 3 выхода
      // W: [inLen, 3], b: [3]. Константы детерминированы.
      const W = tf.tensor2d(this.makeDeterministicWeights(inLen * 3), [inLen, 3], 'float32');
      const b = tf.tensor1d([0.05, -0.02, 0.01], 'float32');
      const x = tf.tensor2d(input, [1, inLen], 'float32'); // [1, inLen]

      const logitsT = tf.add(tf.matMul(x, W), b); // [1,3]
      const probsT = tf.softmax(logitsT);
      const logits = Array.from(logitsT.dataSync());
      const probs = Array.from(probsT.dataSync());
      const labelIndex = probs.indexOf(Math.max(...probs));

      return { logits, probs, labelIndex };
    });
  }

  /** Дет. генерация "весов" для демо предикта, чтобы поведение было стабильным. */
  private makeDeterministicWeights(n: number): number[] {
    const out: number[] = [];
    let s = 1337; // сид
    for (let i = 0; i < n; i++) {
      // простая линейная конгруэнтная последовательность
      s = (1103515245 * s + 12345) >>> 0;
      const v = ((s % 2000) - 1000) / 10000; // [-0.1, 0.1]
      out.push(v);
    }
    return out;
  }
}

export default AIEngine.instance;
