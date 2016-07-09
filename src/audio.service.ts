import {Injectable, Inject} from '@angular/core';

@Injectable()
export class Audio {

  compressor:DynamicsCompressorNode;

  constructor(@Inject('audioContext') private audioCtx) {
    this.compressor = audioCtx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0;
    this.compressor.release.value = 0.25;
    // Try for lulz:
    // this.compressor.release.value = 0;
    this.compressor.connect(audioCtx.destination);
  }

  play(sample, panVal = 0) {
    const source = this.audioCtx.createBufferSource();
    source.buffer = sample;

    const pan = this.audioCtx.createStereoPanner();
    pan.pan.value = panVal;

    source.connect(pan);
    pan.connect(this.compressor);

    source.start(0);

    return () => {
      source.stop(0);
      source.disconnect();
      pan.disconnect();
    }
  }

  // Noise node code from http://noisehack.com/generate-noise-web-audio-api/

  pinkNoiseNode() {
    var b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    var node = this.audioCtx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      for (var i = 0; i < 4096; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
      }
    };
    return node;
  }

  brownNoiseNode() {
    var lastOut = 0.0;
    var node = this.audioCtx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      for (var i = 0; i < 4096; i++) {
          var white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // (roughly) compensate for gain
      }
    }
    return node;
  }

  gainFor(node) {
    var gain = this.audioCtx.createGain();
    node.connect(gain);
    return gain;
  }

  startNode(node) {
    node.connect(this.audioCtx.destination);
  }

  stopNode(node) {
    node.disconnect();
  }

}
