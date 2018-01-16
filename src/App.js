import React       from 'react'
import PCMSonifier from './PCMSonifier.js'
import VideoSource from './VideoSource.js'
import UI          from './UI.js'

/**
 * Application controller that manages interactions between UI, data source, and
 * sonifier
 */
export default class App extends React.Component {
	constructor(props) {
		super(props)

		// Track common parameters
		this.state = {
			hilbertCurveOrder:    2,
			sensitivity:          100,
			freqRange:            [1, 1000],
			lightnessCompression: 0,
			audioCompression:     0.5,
			colorVolume:          100,
		}

		this.sonifier    = new PCMSonifier(this.getBufferLength(this.state.hilbertCurveOrder))
		this.sonifier.setFrequencyBounds(this.logScale(this.state.freqRange[0]), this.logScale(this.state.freqRange[1]))
		this.videoSource = undefined
		this.onChange = this.onChange.bind(this)
	}

	/**
	 * Normalises 0-1000 into 10-10000 logarithmically
	 */
	logScale(x) {
		return Math.round(10**(1+(x/1000)*3))
	}

	/**
	 * Determines the size of array buffer needed for a Hilbert Curve of order `order`
	 */
	getBufferLength(order) {
		return (2**order)**2*2
	}

	/**
	 * Dispatch parameter changes to the relevant objects
	 *
	 * Many parameters will have to be normalised before this can be done
	 */
	onChange(parameter) {
		if (parameter == 'colorVolume') {
			return colorVolume => {
				this.setState({colorVolume})
				this.sonifier.fmVolume = colorVolume/1000
			}
		}
		else if (parameter == 'hilbertCurveOrder') {
			return hilbertCurveOrder => {
				this.setState({hilbertCurveOrder})
				this.sonifier.resize(this.getBufferLength(hilbertCurveOrder))
				this.videoSource.resize(this.getBufferLength(hilbertCurveOrder))
			}
		}
		else if (parameter == 'sensitivity') {
			return sensitivity => {
				this.setState({sensitivity})
				this.videoSource.sensitivity = ((100-sensitivity)/100)*5 + 1
			}
		}
		else if (parameter == 'freqRange') {
			return range => {
				// Between 10Hz-10000Hz
				const [lower, upper] = range
				this.setState({freqRange: [lower, upper]})

				this.sonifier.setFrequencyBounds(this.logScale(lower), this.logScale(upper))
			}
		}
		else if (parameter == 'lightnessCompression') {
			return lightnessCompression => {
				this.setState({lightnessCompression})
				this.videoSource.lightnessCompression = lightnessCompression/1000
			}
		}
		else if (parameter == 'audioCompression') {
			return audioCompression => {
				this.setState({audioCompression})
				this.sonifier.compression = audioCompression/1000
			}
		}
	}

	render() {
		// Pass all state parameters down to UI
		return <UI
			{...this.state}
			onChange={this.onChange}
			onViewportCanvasCreated={el => {
				// Can't request webcam feed until there's a video element available to receive
				// it – this callback is invoked when that has happened, thus a VideoSource can
				// be created
				if (!this.videoSource) {
					this.videoSource = new VideoSource({
						canvas: el,
						length: this.getBufferLength(this.state.hilbertCurveOrder),
						buffers: {
							// Share the same buffers between the sonifier and the videosource
							// for performance
							lightness:  this.sonifier.targets.lightness,
							hue:        this.sonifier.targets.hue,
							saturation: this.sonifier.targets.saturation,
						},
						sensitivity: (((100-this.state.sensitivity)/100))*5 + 1,
					})
				}
			}}
			onClickMenu={key => e => {
				e.preventDefault()
				this.videoSource.setMode(key)
			}}
		/>
	}
}
