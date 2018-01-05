import Tone from 'tone'
import {range} from 'lodash'

export default class HilbertCurveSonifier {
	constructor(buffer_size) {
		// Private
		this._bufferSize = buffer_size
		this._state = {
			buffer: new Float32Array(buffer_size),
			bufferHead: 0,
		}
		this._scales = range(buffer_size).map(idx => {
			const left_side = idx < buffer_size/2
			if (!left_side) idx = buffer_size - (idx - buffer_size/2)
			let osc = new Tone.Oscillator(Math.round((idx/(buffer_size/2))*6000 + 80), 'sine').start()
			let scale = new Tone.Multiply(1)
			let pan = new Tone.Panner(left_side ? -1 : 1).toMaster()
			osc.connect(scale)
			scale.connect(pan)
			return scale
		})

		// Public
		this.targets = {
			buffer: new Float32Array(buffer_size),
		}

		// Set-up
		setInterval(this.updateOscillators.bind(this), 16)
	}

		/*
	xy2d(n, x, y) {
		let rx = 0, ry = 0, s = 0, d = 0

		for (s = n/2; s > 0; s /= 2) {
			rx = (x & s) > 0
			ry = (y & s) > 0
			d += s * s * ((3 * rx) ^ ry)
			{x, y} = rot(s, x, y, rx, ry)
		}

		return d
	}

	d2xy(n, d) {
		let rx = 0, ry = 0, s = 0, t = d

		for (s = 1; s < n; s *= 2) {
			rx = 1 & (t/2)
			ry = 1 & (t ^ rx)
			{x, y} = rot(s, x, y, rx, ry)
			x += s * rx
			y += s * ry
			t /= 4
		}
	}

	rot(n, x, y, rx, ry) {
		if (ry == 0) {
			if (ry == 1) {
				x = n-1 - x
				y = n-1 - y

				let t = x
				x = y
				y = t
			}
		}

		return {x, y}
	}*/

	updateOscillators() {
		for (let idx = 0; idx < this._bufferSize; idx++) {
			this._scales[idx].value = this.targets.buffer[idx] / this._bufferSize
		}
	}

	start() {
		//this._sources.forEach(source => source.start())
	}
}
