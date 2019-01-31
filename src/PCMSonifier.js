import Tone from 'tone'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class PCMSonifier {
	constructor(buffer_size) {
		// Internal buffers where visual features are tracked
		this.buffers = {
			// 128x128 seems more than sufficient
			hue:        new Float32Array(16384),
			saturation: new Float32Array(16384),
			lightness:  new Float32Array(16384),
		}

		// Freq bandwidth for main synthesiser
		this.upperHz = 1800
		this.lowerHz = 40
		// What is the current sample number?  (used to determine time passed)
		this._sample = 0
		// Volume of colour synthesiser
		this.fmVolume = 0

		// Used for compression to determine how much to expand the signal
		this.maxLoudness = 0

		// External buffers used to set a target value to aim for
		this.targets = {
			hue:        new Float32Array(16384),
			saturation: new Float32Array(16384),
			lightness:  new Float32Array(16384),
		}

		// Set-up audio pathway
		const scriptNode = Tone.context.createScriptProcessor(1024, 1, 2)
		const source = new Tone.Source().connect(scriptNode).start()
		//
		// These are modulated so must be tracked in the object
		this.scaleL = new Tone.Scale().connect(new Tone.Panner(-1).toMaster())
		this.scaleR = new Tone.Scale().connect(new Tone.Panner( 1).toMaster())
		this.distortionL = new Tone.Distortion(0).connect(this.scaleL)
		this.distortionR = new Tone.Distortion(0).connect(this.scaleR)
		this.sawtoothNodeL = new Tone.Oscillator(440, 'sawtooth6').connect(this.distortionL).start()
		this.sawtoothNodeR = new Tone.Oscillator(440, 'sawtooth6').connect(this.distortionR).start()
		this.filterNode = new Tone.Filter(this.upperHz, 'lowpass', -48).toMaster()
		this.resize(buffer_size)

		// Register PCM emitter 
		scriptNode.onaudioprocess = this.readBufferProcessEvent.bind(this)
		scriptNode.connect(this.filterNode)
	}

	/**
	 * Recalculated the frequency table between two given frequency
	 */
	setFrequencyBounds(lower, upper) {
		this.upperHz = upper
		this.lowerHz = lower

		const half = this._bufferSize/2

		this._frequencies = new Float32Array(half)
		for (let i = 0; i < half; i++) {
			this._frequencies[i] = 2*Math.PI*(lower*(upper/lower)**(i/half))
		}
		this.filterNode.frequency.set(this._frequencies[half-1])
	}

	/**
	 * Calculate a new Hilbert Curve with this many points
	 */
	resize(buffer_size) {
		this._bufferSize = buffer_size
		this._hilbert    = generateStereoHilbertCurveOfSize(buffer_size)
		this.setFrequencyBounds(this.lowerHz, this.upperHz)
	}

	/**
	 * PCM processing callback, audio data generated here
	 */
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
		// Only look at the central quarter of the image for colour detection
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

		// Modulate frequency for hue
		if (count_hueL > 0) { 
			average_hueL = average_hueL/count_hueL
			this.sawtoothNodeL.frequency.value = average_hueL * 1320 + 440
		}

		if (count_hueR > 0) { 
			average_hueR = average_hueR/count_hueR
			this.sawtoothNodeR.frequency.value = average_hueR * 1320 + 440
		}

		// And distortion and amplitude for saturation
		this.distortionL.distortion = this.scaleL.max = (average_satL/(half/4)) * this.fmVolume
		this.distortionR.distortion = this.scaleR.max = (average_satR/(half/4)) * this.fmVolume
	}
}
