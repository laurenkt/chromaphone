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
			sensitivity: 100,
			freqRange: [1, 1000],
			lightnessCompression: 0,
		}
				const log_scale = x => Math.round(10**(1+(x/1000)*3))

		this.sonifier    = new PCMSonifier(this.getBufferLength(this.state.hilbertCurveOrder))
		this.sonifier.setFrequencyBounds(log_scale(this.state.freqRange[0]), log_scale(this.state.freqRange[1]))
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
				if (!this.videoSource) {
					this.videoSource = new VideoSource(el, this.sonifier.targets.buffer, this.getBufferLength(this.state.hilbertCurveOrder))
					this.videoSource.sensitivity = (((100-this.state.sensitivity)/100))*5 + 1
				}
			}}
			onHilbertCurveOrderChange={hilbertCurveOrder => {
				this.setState({hilbertCurveOrder})
				this.sonifier.resize(this.getBufferLength(hilbertCurveOrder))
				this.videoSource.resize(this.getBufferLength(hilbertCurveOrder))
			}}
			onSensitivityChange={sensitivity => {
				this.setState({sensitivity})
				this.videoSource.sensitivity = ((100-sensitivity)/100)*5 + 1
			}}
			onFreqRangeChange={range => {
				// Between 10Hz-10000Hz
				const log_scale = x => Math.round(10**(1+(x/1000)*3))
				const [lower, upper] = range
				this.setState({freqRange: [lower, upper]})

				this.sonifier.setFrequencyBounds(log_scale(lower), log_scale(upper))
			}}
			onLightnessCompressionChange={lightnessCompression => {
				this.setState({lightnessCompression})
				this.videoSource.lightnessCompression = lightnessCompression/1000
			}}
		/>
	}
}

document.addEventListener('DOMContentLoaded', _ => {
	const reactRoot = document.createElement('div')
	render(<App />, reactRoot)
	document.querySelector('body').appendChild(reactRoot)
})

