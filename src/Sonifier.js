import Tone from 'tone'

export default class Sonifier {
	constructor(buffer_size) {
		// Private
		this._bufferSize = buffer_size
		this._state = {
			buffer: new Float32Array(buffer_size),
			bufferHead: 0,
		}
		this._scriptNode = Tone.context.createScriptProcessor(4096, 1, 1)
		this._source = new Tone.Source().connect(this._scriptNode)

		// Public
		this.targets = {
			buffer: new Float32Array(buffer_size),
		}

		// Set-up
		this._scriptNode.onaudioprocess = this.readBufferProcessEvent.bind(this)
		//TODO UNCOMMENT this._scriptNode.connect(Tone.context.destination)
	}

	readBufferProcessEvent(e) {
		let output = e.outputBuffer.getChannelData(0)
		const len = e.inputBuffer.length
		
		//for (let channel = 0; channel < output.numberOfChannels; channel++) {
		for (let idx = 0; idx < len; idx++) {
			// make output equal to the same as the input
			output[idx] =
				// Original value
				this._state.buffer[this._state.bufferHead] +
				// Move towards new value
				(this.targets.buffer[this._state.bufferHead] - this._state.buffer[this._state.bufferHead])/2;
			// Update cache of original value
			this._state.buffer[this._state.bufferHead] = output[idx];

			if (++this._state.bufferHead >= this._bufferSize)
				this._state.bufferHead -= this._bufferSize
		}
		//}
	}

	start() {
		this._source.start()
	}
}
