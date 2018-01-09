import React       from 'react'
import {render}    from 'react-dom'
import PCMSonifier from './PCMSonifier.js'
import VideoSource from './VideoSource.js'
import UI          from './UI.js'

class App extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			hilbertCurveOrder: 2
		}

		this.sonifier    = new PCMSonifier(this.getBufferLength(this.state.hilbertCurveOrder))
		this.videoSource = undefined
	}

	getBufferLength(order) {
		return (2**order)**2*2
	}

	render() {
		return <UI
			hilbertCurveOrder={this.state.hilbertCurveOrder}
			onViewportCanvasCreated={el => {
				if (!this.videoSource)
					this.videoSource = new VideoSource(el, this.sonifier.targets.buffer, this.getBufferLength(this.state.hilbertCurveOrder))
			}}
			onHilbertCurveOrderChange={hilbertCurveOrder => {
				this.setState({hilbertCurveOrder})
				this.sonifier.resize(this.getBufferLength(hilbertCurveOrder))
				this.videoSource.resize(this.getBufferLength(hilbertCurveOrder))
			}}
		/>
	}
}

document.addEventListener('DOMContentLoaded', _ => {
	const reactRoot = document.createElement('div')
	render(<App />, reactRoot)
	document.querySelector('body').appendChild(reactRoot)
})

