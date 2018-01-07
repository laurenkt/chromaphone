import React       from 'react'
import {render}    from 'react-dom'
import Sonifier    from './Sonifier.js'
import PCMSonifier from './PCMSonifier.js'
import Monitor     from './Monitor.js'
import VideoSource from './VideoSource.js'
import HilbertOverlay from './HilbertOverlay.js'
import Slider      from 'react-slider'

class UI extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			value: 50
		}

		this.onChange = this.onChange.bind(this)
	}

	onChange(value) {
		this.setState({value})
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated}></canvas>
			<HilbertOverlay size={this.props.resolution} />
			<Slider
				defaultValue={50}
				value={this.state.value}
				onChange={this.onChange} />
		</div>
	}
}

// Don't add charts until page has loaded
document.addEventListener('DOMContentLoaded', _ => {
	const length = 512 // or 32, or 512
	const sonifier = new PCMSonifier(length)
	let videoSource

	const reactRoot = document.createElement('div')
	render(<UI
		resolution={length}
		onViewportCanvasCreated={el => {
			if (!videoSource)
				videoSource = new VideoSource(el, sonifier.targets.buffer, length)
		}}
	/>, reactRoot)
	document.querySelector('body').appendChild(reactRoot)

		/*
		onChangeResolution={buffer_size => {
			sonifier.resize(buffer_size)
			videoSource.resize(buffer_size)
		}}
		*/

	sonifier.start()

	//const monitor = new Monitor(document.getElementById('graph'), sonifier.targets.buffer)
})

