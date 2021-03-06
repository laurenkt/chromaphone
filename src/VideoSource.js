export default class VideoSource {
	constructor(opts) {
		opts = Object.assign({}, {
			// Defaults
			sensitivity: 1,
			lightnessCompression: 0
		}, opts)	

		// Create video element that is used as source for webcam/training vids
		this._video = document.createElement('video')
		this._video.autoplay    = true
		this._video.playsinline = true
		this._video.loop        = true
		this._video.controls    = true
		// Insert it into the DOM before the other elements so that it will be obscured
		document.querySelector('body').appendChild(this._video)

		// Public properties
		this.buffers = opts.buffers
		this.sensitivity = opts.sensitivity
		this.lightnessCompression = opts.lightnessCompression

		// Private properties
		// The buffer canvas will just be used as a place to dump pixels for processing
		this._bufferCanvas = document.createElement('canvas')
		document.querySelector('body').appendChild(this._bufferCanvas)
		this._bufferContext = null
		this._canvas  = opts.canvas // This is the canvas that will be drawn upon
		this._context = null
		this._length  = opts.length

		this._video.onplaying = () => {
			if (this._context == null) {
				// Scale into two rectangles to make Hilbert Curve easier to compute
				this.resize(this._length)
				this._context = this._canvas.getContext('2d')
				this._bufferContext = this._bufferCanvas.getContext('2d')
				// 30fps, sufficient for most video
				setInterval(this.nextFrame.bind(this), 33)
			}
		}

		// Start on web-cam mode
		this.setMode('camera')
	}

	/**
	 * Toggles between webcam mode and training videos
	 */
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

	/**
	 * When a webcam stream is loaded, point the video element at it
	 */
	handleSuccess(stream) {
		var videoTracks = stream.getVideoTracks()
		console.log('Using video device: ' + videoTracks[0].label)
		this._video.srcObject = stream
	}

	/**
	 * Adjust the canvas sizes for a new pixel length
	 */
	resize(length) {
		this.height  = this._bufferCanvas.height = this._canvas.height = Math.sqrt(length / 2)
		this.width   = this._bufferCanvas.width  = this._canvas.width = this._canvas.height * 2
		this._length = length
	}

	/**
	 * These are experimental technologies and they don't always work
	 */
	handleError(error) {
		if (error.name === 'ConstraintNotSatisfiedError') {
			this.errorMsg('The resolution ' + this._video.width.exact + 'x' +
				this._video.width.exact + ' px is not supported by your device.')
		} else if (error.name === 'PermissionDeniedError') {
			this.errorMsg('Permissions have not been granted to use your camera and ' +
				'microphone, you need to allow the page access to your devices in ' +
				'order for the demo to work.')
		}
		this.errorMsg(`getUserMedia error: ${error.name}. Please make sure you are using the latest version of Google Chrome`, error)
	}

	errorMsg(msg, error) {
		alert(msg)
		if (typeof error !== 'undefined') {
			console.error(error)
		}
	}

	/**
	 * Process the next image frame
	 */
	nextFrame() {
		// Cache
		const width  = this.width
		const offset = this.height ** 2

		// Draw pixels onto buffer canvas so they can be extracted for processing
		this._bufferContext.drawImage(this._video, 0, 0, width, this.height)
		const image_data_obj = this._bufferContext.getImageData(0, 0, width, this.height)
		const image_data     = image_data_obj.data

		// Create a new buffer to store the pixels that will be output in the final version
		const image_data_to_display = this._context.createImageData(image_data_obj)

		// Buffers
		const lightnesses = new Float32Array(width * this.height)
		const hues        = new Float32Array(width * this.height)
		const saturations = new Float32Array(width * this.height)

		// Used for HDR/lightness normalisation
		let lightest = 0
		let darkest  = 1

		for (let i = 0, idx = 0; i < image_data.byteLength; i++, idx++) {
			// Increment RGB, alpha is skipped by increment in for loop
			const r = image_data[i++] / 0xFF
			const g = image_data[i++] / 0xFF
			const b = image_data[i++] / 0xFF

			// Determine HUE of the colour
			const max = Math.max(r,g,b)
			const min = Math.min(r,g,b)
			
			const chroma = max - min

			let hue = undefined
			if (chroma != 0) {
				if (max == r) {
					hue = ((g-b)/chroma % 6)/6
				}
				else if (max == g) {
					hue = ((b-r)/chroma + 2)/6
				}
				else if (max == b) {
					hue = ((r-g)/chroma + 4)/6
				}
				// should do lightness and sat 
				// scale between -1 and 1
				hues[idx] = hue
			}
			else {
				// Greyscale
				hues[idx] = NaN
			}

			// Determine lightness
			lightnesses[idx] = (max+min)/2
			// Determine saturation
			saturations[idx] = lightnesses[idx] == 1 ? 0 :
				               lightnesses[idx] == 0 ? 0 : 
				               chroma/(1 - Math.abs(2*lightnesses[idx] - 1))

			// Adjust tally of max/min lightness
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
				this.buffers.lightness[idx_l]  = lightness
				this.buffers.hue[idx_l]        = hues[idx]
				this.buffers.saturation[idx_l] = saturations[idx]
				idx_l++
			}
			// Right
			else {
				this.buffers.lightness[offset + idx_r] = lightness
				this.buffers.hue[offset + idx_r]       = hues[idx]
				this.buffers.saturation[offset+idx_r]  = saturations[idx]
				idx_r++
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

		// Draw to real canvas
		this._context.putImageData(image_data_to_display, 0, 0)
	}

}
