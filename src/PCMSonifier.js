import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Private
		this._state = {
			buffer: new Float32Array(16384), // 128x128... seems more than sufficient..
			bufferHead: 0,
		}
		this.upperHz = 1800
		this.lowerHz = 40

		this._scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		this._source = new Tone.Source().connect(this._scriptNode)
		this._sample = 0

		// Public
		this.targets = {
			buffer: new Float32Array(16384),
		}

		// Set-up
		this._filterNode = new Tone.Filter(this.upperHz, 'lowpass', -48).toMaster()
		this.resize(buffer_size)
		this._scriptNode.onaudioprocess = this.readBufferProcessEvent.bind(this)
		this._scriptNode.connect(this._filterNode)

	}

	setFrequencyBounds(lower, upper) {
		this.upperHz = upper
		this.lowerHz = lower

		const half = this._bufferSize/2

		this._frequencies = new Float32Array(half)
		for (let i = 0; i < half; i++) {
			this._frequencies[i] = 2*Math.PI*(lower*(upper/lower)**(i/half))
		}
		this._filterNode.frequency.set(this._frequencies[half-1])
	}

	resize(buffer_size) {
		this._bufferSize = buffer_size
		this._hilbert    = generateStereoHilbertCurveOfSize(buffer_size)
		this.setFrequencyBounds(this.lowerHz, this.upperHz)
	}

	readBufferProcessEvent(e) {
		let l = e.outputBuffer.getChannelData(0)
		let r = e.outputBuffer.getChannelData(1)
		const len      = e.inputBuffer.length
		const half     = this._bufferSize >> 1
		const sources  = this.targets.buffer
		const averages = this._state.buffer

		for (let idx = 0; idx < len; idx++) {
			const t = this._sample / 44100
			
			// Zero before summing
			l[idx] = 0
			r[idx] = 0

			// Iterate through all possible tones, summing
			for (let tone_idx = 0; tone_idx < half; tone_idx++) {
				const tone = Math.sin(t * this._frequencies[tone_idx])
				// Smooth (moving average)
				averages[tone_idx]      = (sources[this._hilbert[tone_idx]]      + averages[tone_idx]) / 2
				averages[half+tone_idx] = (sources[this._hilbert[half+tone_idx]] + averages[tone_idx]) / 2

				// TODO: compression
				l[idx] += (tone * averages[tone_idx] )/half
				r[idx] += (tone * averages[half + tone_idx] )/half
			}

			this._sample++
		}
	}

	start() {
		this._source.start()
	}
}
