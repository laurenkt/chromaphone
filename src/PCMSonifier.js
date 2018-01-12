import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Private
		this.buffers = {
			lightness: new Float32Array(16384), // 128x128... seems more than sufficient..
			hue:       new Float32Array(16384), // 128x128... seems more than sufficient..
		}
		this.upperHz = 1800
		this.lowerHz = 40

		this._scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		this._source = new Tone.Source().connect(this._scriptNode)
		this._sample = 0

		this.sawtoothNodeL = new Tone.Oscillator(440, 'square')
		this.sawtoothNodeR = new Tone.Oscillator(440, 'square')
		this.sawtoothNodeL.connect((new Tone.Panner(-1)).toMaster())
		this.sawtoothNodeR.connect((new Tone.Panner( 1)).toMaster())
		this.sawtoothNodeL.start()
		this.sawtoothNodeR.start()

		// Public
		this.targets = {
			lightness: new Float32Array(16384),
			hue:       new Float32Array(16384),
		}

		// For debugging
		window.targets = this.targets

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
		const sources  = this.targets.lightness
		const averages = this.buffers.lightness

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

		const hues = this.targets.hue

		let average_hueL = 0
		let average_hueR = 0
		let count_hueL = 0
		let count_hueR = 0
		// Central 'quarter'
		for (let idx = 0; idx < half/8; idx++) {
			if (!Number.isNaN(hues[idx+half/4+half/8])) {
				average_hueL += hues[idx+half/4+half/8]
				count_hueL++
			}
			if (!Number.isNaN(hues[half+idx+half/44+half/8])) {
				average_hueR += hues[half+idx+half/4+half/8]
				count_hueR++
			}
		}

		if (count_hueL > 0) { 
			average_hueL = average_hueL/count_hueL
			this.sawtoothNodeL.frequency.value = average_hueL * 440 + 440
		}

		if (count_hueR > 0) { 
			average_hueR = average_hueR/count_hueR
			this.sawtoothNodeR.frequency.value = average_hueR * 440 + 440
		}
	}

	start() {
		this._source.start()
	}
}
