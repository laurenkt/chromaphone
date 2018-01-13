import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Private
		this.buffers = {
			// 128x128 seems more than sufficient
			hue:        new Float32Array(16384),
			saturation: new Float32Array(16384),
			lightness:  new Float32Array(16384),
		}
		this.upperHz = 1800
		this.lowerHz = 40

		this._scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		this._source = new Tone.Source().connect(this._scriptNode)
		this._sample = 0
		this.fmVolume = 0

		this.scaleL = new Tone.Scale().connect(new Tone.Panner(-1).toMaster())
		this.scaleR = new Tone.Scale().connect(new Tone.Panner( 1).toMaster())
		this.distortionL = new Tone.Distortion(0).connect(this.scaleL)
		this.distortionR = new Tone.Distortion(0).connect(this.scaleR)
		this.sawtoothNodeL = new Tone.Oscillator(440, 'sawtooth6').connect(this.distortionL).start()
		this.sawtoothNodeR = new Tone.Oscillator(440, 'sawtooth6').connect(this.distortionR).start()

		// Public
		this.targets = {
			hue:        new Float32Array(16384),
			saturation: new Float32Array(16384),
			lightness:  new Float32Array(16384),
		}

		this.maxLoudness = 0

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

			// Decrease dynamic range
			// Technically we should use abs values here because the output range is [-1 1] but
			// this loop is probably expensive enough already and it will function approximately
			// the same
			if (l[idx] > this.maxLoudness || r[idx] > this.maxLoudness)
				this.maxLoudness += 1e-5

			if (this.maxLoudness > 0 && this.compression > 0) {
				l[idx] = l[idx] / (this.maxLoudness + (1-this.maxLoudness)*(1-this.compression))
				r[idx] = r[idx] / (this.maxLoudness + (1-this.maxLoudness)*(1-this.compression))
			}

			// Reduce to effect maximum compression
			this.maxLoudness -= 1e-6 // will reset back to zero after 10 seconds

			this._sample++
		}

		const hues = this.targets.hue
		const saturations = this.targets.saturation

		let average_hueL = 0,
		    average_hueR = 0,
		    count_hueL = 0,
			count_hueR = 0,
			average_satL = 0,
			average_satR = 0
		// Central 'quarter'
		for (let idx = 0; idx < half/4; idx++) {
			average_satL += saturations[       idx+half/4+half/8]
			average_satR += saturations[half + idx+half/4+half/8]
			if (!Number.isNaN(hues[idx+half/4+half/8])) {
				average_hueL += hues[idx+half/4+half/8]
				count_hueL++
			}
			if (!Number.isNaN(hues[half+idx+half/4+half/8])) {
				average_hueR += hues[half+idx+half/4+half/8]
				count_hueR++
			}
		}

		if (count_hueL > 0) { 
			average_hueL = average_hueL/count_hueL
			this.sawtoothNodeL.frequency.value = average_hueL * 1320 + 440
		}

		if (count_hueR > 0) { 
			average_hueR = average_hueR/count_hueR
			this.sawtoothNodeR.frequency.value = average_hueR * 1320 + 440
		}

		this.distortionL.distortion = this.scaleL.max = (average_satL/(half/4)) * this.fmVolume
		this.distortionR.distortion = this.scaleR.max = (average_satR/(half/4)) * this.fmVolume
	}

	start() {
		this._source.start()
	}
}
