export default class VideoSource {
	constructor(canvas, buffer, length, sensitivity) {
		this._video = document.createElement('video')
		this._video.autoplay    = true
		this._video.playsinline = true
		this._video.loop        = true
		document.querySelector('body').appendChild(this._video)

		// Public properties
		this.buffer      = buffer
		this.sensitivity = sensitivity || 1
		this.lightnessCompression = 0

		// Private properties
		this._bufferCanvas = document.createElement('canvas')
		document.querySelector('body').appendChild(this._bufferCanvas)
		this._bufferContext = null
		this._canvas  = canvas
		this._context = null
		this._length  = length

		this._video.onplaying = () => {
			console.log('Playing starting')
			// Scale into two rectangles to make Hilbert Curve easier to compute
			this.resize(this._length)
			this._context = this._canvas.getContext('2d')
			this._bufferContext = this._bufferCanvas.getContext('2d')
			// 30fps, sufficient for most video
			setInterval(this.nextFrame.bind(this), 33)
		}

		this.setMode('camera')
	}

	setMode(mode) {
		if (mode == 'camera') {
			navigator.mediaDevices
				.getUserMedia({audio: false, video: true}) // Don't need audio
				.then(this.handleSuccess.bind(this))
				.catch(this.handleError.bind(this))
		}
		else {
			this._video.srcObject = null
			this._video.src = `assets/${mode}.mp4`
		}
	}

	handleSuccess(stream) {
		var videoTracks = stream.getVideoTracks()
		console.log('Using video device: ' + videoTracks[0].label)
		this._video.srcObject = stream
	}

	resize(length) {
		this.height  = this._bufferCanvas.height = this._canvas.height = Math.sqrt(length / 2)
		this.width   = this._bufferCanvas.width  = this._canvas.width = this._canvas.height * 2
		this._length = length
	}

	handleError(error) {
		if (error.name === 'ConstraintNotSatisfiedError') {
			this.errorMsg('The resolution ' + this._video.width.exact + 'x' +
				this._video.width.exact + ' px is not supported by your device.')
		} else if (error.name === 'PermissionDeniedError') {
			this.errorMsg('Permissions have not been granted to use your camera and ' +
				'microphone, you need to allow the page access to your devices in ' +
				'order for the demo to work.')
		}
		this.errorMsg('getUserMedia error: ' + error.name, error)
	}

	errorMsg(msg, error) {
		alert(msg)
		if (typeof error !== 'undefined') {
			console.error(error)
		}
	}

	nextFrame() {

		const width  = this.width
		const offset = this.height ** 2

		this._bufferContext.drawImage(this._video, 0, 0, width, this.height)
		const image_data_obj = this._bufferContext.getImageData(0, 0, width, this.height)
		const image_data     = image_data_obj.data

		const image_data_to_display = this._context.createImageData(image_data_obj)

		const lightnesses = new Float32Array(width * this.height)
		let lightest = 0
		let darkest  = 1

		for (let i = 0, idx = 0; i < image_data.byteLength; i++, idx++) {
			// Increment RGB, alpha is skipped by increment in for loop
			const r = image_data[i++]
			const g = image_data[i++]
			const b = image_data[i++]

			/*
			// Determine HUE of the colour
			const max = Math.max(r,g,b)
			const min = Math.min(r,g,b)
			
			const chroma = max - min

			let hue = undefined
			if (chroma != 0) {
				if (max == r) {
					hue = 60 * ((g-b)/chroma % 6)
				}
				else if (max == g) {
					hue = 60 * ((b-r)/chroma + 2)
				}
				else if (max == b) {
					hue = 60 * ((r-g)/chroma + 4)
				}
				// should do lightness and sat 
				// scale between -1 and 1
				//this.buffer[idx++] = (hue - 180) / 360
			}
			else {
				//this.buffer[idx++] = 0
			}*/

			lightnesses[idx] = (r+g+b)/765

			if (lightnesses[idx] > lightest)
				lightest = lightnesses[idx]

			if (lightnesses[idx] < darkest)
				darkest = lightnesses[idx]
		}

		// Adjust compression values
		darkest   *= this.lightnessCompression
		lightest  += (1-lightest)*(1-this.lightnessCompression)

		let idx_l = 0
		let idx_r = 0
		for (let i = 0, idx = 0; i < image_data.byteLength; i += 4, idx++) {
			// Compress within range in full image
			// Currently only works when music is already playing
			// needs a scaler
			const compressed = ((lightnesses[idx] - darkest)) / (lightest-darkest)
			const lightness = compressed**this.sensitivity
			const scale_factor = lightness/lightnesses[idx]

			// Output data to buffers
			// Left
			if (idx % width < width/2) {
				this.buffer[idx_l++] = lightness
			}
			// Right
			else {
				this.buffer[offset + idx_r++] = lightness
			}

			// Draw data to canvas
			image_data_to_display.data[i]   = image_data[i]   * scale_factor
			image_data_to_display.data[i+1] = image_data[i+1] * scale_factor
			image_data_to_display.data[i+2] = image_data[i+2] * scale_factor
			image_data_to_display.data[i+3] = 0xFF // Alpha

			if (idx_l >= this._length >> 1) {
				idx_l -= this._length >> 1
			}
			if (idx_r >= this._length >> 1) {
				idx_r -= this._length >> 1
			}
		}

		this._context.putImageData(image_data_to_display, 0, 0)
	}

}
