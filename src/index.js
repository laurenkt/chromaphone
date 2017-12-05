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

		/*
	// This gives us the actual ArrayBuffer that contains the data
	var nowBuffering = buffer.getChannelData(0)
	for (var i = 0; i < buffer.length; i++) {
		// Math.random() is in [0; 1.0]
		// audio needs to be in [-1.0; 1.0]
		nowBuffering[i] = Math.random() * 2 - 1
	}*/

		/*
	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	var source = audioCtx.createBufferSource()
	source.loop = true
	// set the buffer in the AudioBufferSourceNode
	source.buffer = buffer

	var scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);


	let idx = 0
	const mask = buffer.length - 1
	scriptNode.onaudioprocess = function(audioProcessingEvent) {
		// The input buffer is the song we loaded earlier
		var inputBuffer = audioProcessingEvent.inputBuffer;

		// The output buffer contains the samples that will be modified and played
		var outputBuffer = audioProcessingEvent.outputBuffer;

		// Loop through the output channels (in this case there is only one)
		for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
			var inputData = inputBuffer.getChannelData(channel);
			var outputData = outputBuffer.getChannelData(channel);

			// Loop through the 4096 samples
			for (var sample = 0; sample < inputBuffer.length; sample++) {
				// make output equal to the same as the input
				outputData[sample] = outputData[sample] + (targetBuffer[idx] - outputData[sample])/2;
				outputBuffer[idx]  = outputData[sample];

				idx = (idx+1) & mask
			}
			
		}
	}

	const LPF = audioCtx.createBiquadFilter()
	LPF.type = 'lowpass'
	LPF.frequency.value = 3000
	LPF.gain.value = 1

	const LPF2 = audioCtx.createBiquadFilter()
	LPF2.type = 'lowpass'
	LPF2.frequency.value = 4000
	LPF2.gain.value = 1

	LPF2.connect(audioCtx.destination)
	LPF.connect(LPF2)
	scriptNode.connect(LPF)
	source.connect(scriptNode)
	// start the source playing
	source.start()*/

	const monitor = new Monitor(document.getElementById('graph'), sonifier.targets.buffer)
})

