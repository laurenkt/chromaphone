import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Private
		this._state = {
			buffer: new Float32Array(16384), // 128x128... seems more than sufficient..
			bufferHead: 0,
		}
		this.resize(buffer_size)
		this._scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		this._source = new Tone.Source().connect(this._scriptNode)
		this._sample = 0

		// Public
		this.targets = {
			buffer: new Float32Array(16384),
		}

		// Set-up
		this._scriptNode.onaudioprocess = this.readBufferProcessEvent.bind(this)
		let filter = new Tone.Filter(1440, 'lowpass', -48).toMaster()
		this._scriptNode.connect(filter)

	}

	resize(buffer_size) {
		console.log('set buffer size ', buffer_size)
		this._bufferSize = buffer_size
		this._hilbert    = generateStereoHilbertCurveOfSize(buffer_size)
	}

	readBufferProcessEvent(e) {
		let l = e.outputBuffer.getChannelData(0)
		let r = e.outputBuffer.getChannelData(1)
		const len = e.inputBuffer.length
		const half = this._bufferSize >> 1

		for (let idx = 0; idx < len; idx++) {
			const t = this._sample / 44100
			
			// Zero before summing
			l[idx] = 0
			r[idx] = 0

			// Iterate through all possible tones, summing
			for (let tone_idx = 0; tone_idx < half; tone_idx++) {
				const scale = 1-(tone_idx/half)
				const tone = Math.sin(t * (2*Math.PI*( 144*((1440/144)**scale) ))) // Min and max freq
				// Smooth
				this._state.buffer[tone_idx] = (this.targets.buffer[tone_idx] + this._state.buffer[tone_idx]) / 2
				this._state.buffer[half+tone_idx] = (this.targets.buffer[half+tone_idx] + this._state.buffer[tone_idx]) / 2

				// TODO: HILBERT
				l[idx] += (tone *
					this._state.buffer[this._state.bufferHead] )/100
				r[idx] += (tone *
					this._state.buffer[half + this._state.bufferHead] )/100
			}

			this._sample++

			if (++this._state.bufferHead >= half)
				this._state.bufferHead -= half
		}
	}

	start() {
		this._source.start()
	}
}
