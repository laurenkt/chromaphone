import React       from 'react'
import {render}    from 'react-dom'
import PCMSonifier from './PCMSonifier.js'
import VideoSource from './VideoSource.js'
import UI          from './UI.js'

class App extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			hilbertCurveOrder: 2,
			sensitivity: 1,
			freqRange: [1, 1000],
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
			sensitivity={this.state.sensitivity}
			freqRange={this.state.freqRange}
			onViewportCanvasCreated={el => {
				if (!this.videoSource)
					this.videoSource = new VideoSource(el, this.sonifier.targets.buffer, this.getBufferLength(this.state.hilbertCurveOrder))
			}}
			onHilbertCurveOrderChange={hilbertCurveOrder => {
				this.setState({hilbertCurveOrder})
				this.sonifier.resize(this.getBufferLength(hilbertCurveOrder))
				this.videoSource.resize(this.getBufferLength(hilbertCurveOrder))
			}}
			onSensitivityChange={sensitivity => {
				this.setState({sensitivity})
				this.videoSource.sensitivity = ((100-sensitivity)/100)*6
			}}
			onFreqRangeChange={range => {
				// Between 10Hz-10000Hz
				const log_scale = x => Math.round(10**(1+(x/1000)*3))
				const [lower, upper] = range
				this.setState({freqRange: [lower, upper]})

				this.sonifier.setFrequencyBounds(log_scale(lower), log_scale(upper))
			}}
		/>
	}
}

document.addEventListener('DOMContentLoaded', _ => {
	const reactRoot = document.createElement('div')
	render(<App />, reactRoot)
	document.querySelector('body').appendChild(reactRoot)
})

