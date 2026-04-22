import * as tf from '@tensorflow/tfjs';

export class MLTrainer {
  constructor() {
    this.model = null;
  }

  async createModel(inputShape, outputShape, config) {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
      inputShape: [inputShape],
      units: config.hiddenLayers[0] || 10,
      activation: 'relu'
    }));

    // Hidden layers
    for (let i = 1; i < config.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: config.hiddenLayers[i],
        activation: 'relu'
      }));
    }

    // Output layer
    model.add(tf.layers.dense({
      units: outputShape,
      activation: outputShape > 1 ? 'softmax' : 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: outputShape > 1 ? 'categoricalCrossentropy' : 'meanSquaredError',
      metrics: ['mse']
    });

    this.model = model;
    return model;
  }

  async train(
    xData,
    yData,
    config,
    onEpochEnd
  ) {
    if (!this.model) throw new Error('Model not created');

    const xs = tf.tensor2d(xData);
    const ys = tf.tensor2d(yData);

    await this.model.fit(xs, ys, {
      epochs: config.epochs,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          onEpochEnd({ epoch, loss: logs?.loss || 0 });
        }
      }
    });

    xs.dispose();
    ys.dispose();
  }

  async predict(input) {
    if (!this.model) throw new Error('Model not trained');
    const inputTensor = tf.tensor2d([input]);
    const prediction = this.model.predict(inputTensor);
    const result = await prediction.data();
    inputTensor.dispose();
    prediction.dispose();
    return Array.from(result);
  }

  async saveModel(name) {
    if (!this.model) throw new Error('No model to save');
    await this.model.save(`localstorage://${name}`);
  }

  async loadModel(name) {
    this.model = await tf.loadLayersModel(`localstorage://${name}`);
  }
}
