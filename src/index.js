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
			value: 2
		}

		this.onChange = this.onChange.bind(this)
	}

	onChange(value) {
		this.setState({value})
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated}></canvas>
			<HilbertOverlay size={(2**this.state.value)**2*2} />
			<Slider
				defaultValue={3}
				value={this.state.value}
				step={1}
				min={1}
				max={6}
				onChange={this.onChange} />
		</div>
	}
}

// Don't add charts until page has loaded
document.addEventListener('DOMContentLoaded', _ => {
	const order = 2 // 7 is nuts
	const length = ((2**order)**2)*2 // or 32, or 512, 2048
	const sonifier = new PCMSonifier(length)
	let videoSource

	const reactRoot = document.createElement('div')
	render(<UI
		resolution={order}
		onViewportCanvasCreated={el => {
			console.log('onViewportCanvasCreated')
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

