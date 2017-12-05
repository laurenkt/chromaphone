import Sonifier    from './Sonifier.js'
import Monitor     from './Monitor.js'
import VideoSource from './VideoSource.js' 

// Don't add charts until page has loaded
document.addEventListener('DOMContentLoaded', _ => {
	const video  = document.querySelector('video')
	const canvas = document.getElementById('video')
	let context  = null
	const constraints = {
		audio: false,
		video: true
	}
	// Put variables in global scope to make them available to the browser console.

	function handleSuccess(stream) {
		var videoTracks = stream.getVideoTracks()
		console.log('Got stream with constraints:', constraints)
		console.log('Using video device: ' + videoTracks[0].label)
		stream.oninactive = function() {
			console.log('Stream inactive')
		}
		window.stream   = stream // make variable available to browser console
		video.onplaying = () => {
			setInterval(nextFrame, 16)
		}
		video.onplay= () => console.log('video play')
		video.srcObject = stream
		context         = canvas.getContext('2d')
	}

	function handleError(error) {
		if (error.name === 'ConstraintNotSatisfiedError') {
			errorMsg('The resolution ' + video.width.exact + 'x' +
				video.width.exact + ' px is not supported by your device.')
		} else if (error.name === 'PermissionDeniedError') {
			errorMsg('Permissions have not been granted to use your camera and ' +
				'microphone, you need to allow the page access to your devices in ' +
				'order for the demo to work.')
		}
		errorMsg('getUserMedia error: ' + error.name, error)
	}

	function errorMsg(msg, error) {
		alert(msg)
		if (typeof error !== 'undefined') {
			console.error(error)
		}
	}

	const sonifier = new Sonifier(3072)

	// Audio stuff
	//
	/*
	const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
	let buffer = audioCtx.createBuffer(1, 3072, 44100);
	let targetBuffer = new Float32Array(3072);
	let outputBuffer = new Float32Array(3072);*/

	function nextFrame() {
		canvas.width  = video.videoWidth/10
		canvas.height = video.videoHeight/10
		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		const image_data = context.getImageData(0, 0, canvas.width, canvas.height).data
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
				sonifier.targets.buffer[idx++] = (hue - 180) / 360
			}
			else
				sonifier.targets.buffer[idx++] = 0
			// ignore alpha
			//
			
			if (idx >= 3072)
				idx -= 3072
		}
	}


	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(handleSuccess)
		.catch(handleError)

	sonifier.start()

	const monitor = new Monitor(document.getElementById('graph'), sonifier.targets.buffer)
})

