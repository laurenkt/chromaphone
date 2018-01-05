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
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated}></canvas>
			<HilbertOverlay size={512} />
			<Slider defaultValue={50} />
		</div>
	}
}

// Don't add charts until page has loaded
document.addEventListener('DOMContentLoaded', _ => {
	const body = document.querySelector('body')

	const video = document.createElement('video')
	video.autoplay    = true
	video.playsinline = true
	body.appendChild(video)

	const sonifier = new PCMSonifier(512)
	let videoSource

	const reactRoot = document.createElement('div')
	render(<UI onViewportCanvasCreated={el => {
		videoSource = new VideoSource(video, el, sonifier.targets.buffer)
	}}/>, reactRoot)
	document.querySelector('body').appendChild(reactRoot)

	//sonifier.start()

	//const monitor = new Monitor(document.getElementById('graph'), sonifier.targets.buffer)
})

