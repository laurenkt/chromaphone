export default class VideoSource {
	constructor(video, canvas, buffer) {
		// Public properties
		this.buffer = buffer

		// Private properties
		this._video   = video
		this._canvas  = canvas
		this._context = null

		navigator.mediaDevices
			.getUserMedia({audio: false, video: true}) // Don't need audio
			.then(this.handleSuccess.bind(this))
			.catch(this.handleError.bind(this))
	}

	handleSuccess(stream) {
		var videoTracks = stream.getVideoTracks()
		console.log('Got stream')
		console.log('Using video device: ' + videoTracks[0].label)
		stream.oninactive = function() {
			console.log('Stream inactive')
		}
		this._video.onplaying = () => {
			setInterval(this.nextFrame.bind(this), 16)
		}
		this._video.onplay = () => console.log('video play')
		this._video.srcObject = stream
		this._context = this._canvas.getContext('2d')
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
		this._canvas.width  = this._video.videoWidth/10
		this._canvas.height = this._video.videoHeight/10
		this._context.drawImage(this._video, 0, 0, this._canvas.width, this._canvas.height)
		const image_data = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height).data
		let idx = 0
		for (let i = 0; i < image_data.byteLength; i++) {
			const r = image_data[i++]
			const g = image_data[i++]
			const b = image_data[i++]

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
				/* should do lightness and sat */
				// scale between -1 and 1
				this.buffer[idx++] = (hue - 180) / 360
			}
			else
				this.buffer[idx++] = 0
			// ignore alpha
			//
			
			if (idx >= 3072)
				idx -= 3072
		}
	}

}
