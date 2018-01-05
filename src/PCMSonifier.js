import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Private
		this._bufferSize = buffer_size
		this._halfBuffer = buffer_size/2
		this._state = {
			buffer: new Float32Array(buffer_size),
			bufferHead: 0,
		}
		this._hilbert = generateStereoHilbertCurveOfSize(buffer_size)
		this._scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		this._source = new Tone.Source().connect(this._scriptNode)
		this._sample = 0

		// Public
		this.targets = {
			buffer: new Float32Array(buffer_size),
		}

		// Set-up
		this._scriptNode.onaudioprocess = this.readBufferProcessEvent.bind(this)
		let filter = new Tone.Filter(3000, 'lowpass', -48).toMaster()
		this._scriptNode.connect(filter)

	}

	readBufferProcessEvent(e) {
		let l = e.outputBuffer.getChannelData(0)
		let r = e.outputBuffer.getChannelData(1)
		const len = e.inputBuffer.length
		const angular_freq_factor = 2 * Math.PI * 3000 // Max freq

		for (let idx = 0; idx < len; idx++) {
			// Zero before summing
			l[idx] = 0
			r[idx] = 0
			const t = this._sample / 44100

			for (let tone_idx = 0; tone_idx < this._halfBuffer; tone_idx++) {
				const angular_freq = angular_freq_factor * (tone_idx/this._halfBuffer) + 120 // Min freq
				//l[idx] += (Math.sin(t * angular_freq) * this.targets.buffer[this._hilbert.buffer[this._state.bufferHead]] )/this._halfBuffer
				//r[idx] += (Math.sin(t * angular_freq) * this.targets.buffer[this._hilbert.buffer[this._halfBuffer + this._state.bufferHead]] )/this._halfBuffer
			}

			this._sample++

				/*
				// Original value
				this._state.buffer[this._state.bufferHead] +
				// Move towards new value
				(this.targets.buffer[this._state.bufferHead] - this._state.buffer[this._state.bufferHead])/2;
			// Update cache of original value
			this._state.buffer[this._state.bufferHead] = output[idx];
			*/
			if (++this._state.bufferHead >= this._halfBuffer)
				this._state.bufferHead -= this._halfBuffer
		}
	}

	start() {
		this._source.start()
	}
}
