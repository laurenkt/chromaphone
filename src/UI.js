import React          from 'react'
import HilbertOverlay from './HilbertOverlay.js'
import Slider         from 'react-slider'
import {Players}      from 'tone'

// Load audio files
// These must be loaded into the compiler and bundled with the app JS because
// otherwise web browsers will not permit them to be played locally
// (cross-origin security restriction)
// This isn't very efficient though, so on a live web-site they would be 
// externally loaded
import audioSensitivity from '../assets/sensitivity.aac'
import audioFreqRange   from '../assets/freqRange.aac'
import audioHCOrder     from '../assets/hilbertCurveOrder.aac'
import audioLightNorm   from '../assets/lightnessNormalisation.aac'
import audioCompression from '../assets/compression.aac'
import audioColorVol    from '../assets/colorVolume.aac'

export default class UI extends React.Component {
	constructor(props) {
		super(props)

		// UI state (toggles etc)
		this.state = {
			focus: undefined, // which slider/object is active
			overlay: true,    // whether to draw the hilbert curve
			earcons: true,    // whether to play earcons
			sliders: true,    // whether to draw the sliders
		}

		// Set-up earcon audio players
		this.earconPlayers = new Players({
			'sensitivity':          `${audioSensitivity}`,
			'freqRange':            `${audioFreqRange}`,
			'hilbertCurveOrder':    `${audioHCOrder}`,
			'lightnessCompression': `${audioLightNorm}`,
			'audioCompression':     `${audioCompression}`,
			'colorVolume':          `${audioColorVol}`,
		}).toMaster()

		this.focus     = this.focus.bind(this)
		this.Parameter = this.Parameter.bind(this)
		this.Toggle    = this.Toggle.bind(this)
	}

	// Workaround to cause handles to render properly in React 16
	// https://github.com/mpowaga/react-slider/issues/115
	componentDidMount () {
		setTimeout(() => this.forceUpdate(), 1)
	}

	/**
	 * Change which UI element is 'focused', and play relevant
	 * earcon if enabled
	 */
	focus(key) {
		return e => { 
			if (e.preventDefault)
				e.preventDefault()

			if (this.state.earcons && this.earconPlayers.has(key))
				this.earconPlayers.get(key).start()

			this.setState({focus: key})
		}
	}

	/**
	 * Stateless component containing genericised parameter slider
	 * and behaviour
	 */
	Parameter({name, min, max, children, tooltip, ...props}) {
		// Pass on any props unspecified
		// Adjust render behaviour based on toggles
		return <Slider
			{...props}
			className={`slider ${this.state.focus == name && '-focus'} ${!this.state.sliders && '-invisible'}`}
			value={this.props[name]}
			step={1}
			min={min}
			max={max}
			onChange={this.state.focus == name ? this.props.onChange(name) : this.focus(name)}>
			{/* Use a normalised percentage label if no label is specified */}
			{children ||
				<span data-tooltip={tooltip}>{Math.floor(100* ((this.props[name]-min) / (max-min)))}%</span>}
		</Slider>
	}

	/**
	 * Stateless component containing toggle switches
	 */
	Toggle({name, children}) {
		return <a
			href="#"
			className={this.state[name] ? '-enabled' : '-disabled'}
			onClick={e => {
				e.preventDefault();
				this.setState({[name]: !this.state[name]})
			}}>
			{/* Display unicode check-marks and crosses */}
			{this.state[name] && <span>&#x2714;</span> || <span>&#x2718;</span>} {children}
		</a>
	}

	render() {
		return <div className="ui">
			{/* This is the canvas the sonification system will draw to, it must be defined here */}
			<canvas ref={this.props.onViewportCanvasCreated} onClick={this.focus(undefined)}></canvas>
			{this.state.overlay && 
				<HilbertOverlay order={this.props.hilbertCurveOrder} onClick={this.focus(undefined)} />}
			{/* Params */}
			<this.Parameter name="sensitivity" tooltip="Sensitivity" min={1} max={100} />
			<this.Parameter name="lightnessCompression" tooltip="Lightness Normalisation" min={0} max={1000} />
			<this.Parameter name="audioCompression" tooltip="Compression" min={0} max={1000} />
			<this.Parameter name="hilbertCurveOrder" min={1} max={6}>
				<span data-tooltip="Hilbert Curve Order">{this.props.hilbertCurveOrder}</span>
			</this.Parameter>
			<this.Parameter name="colorVolume" tooltip="Colour Volume" min={0} max={1000} />
			<this.Parameter name="freqRange" min={1} max={1000} pearling minDistance={10}>
				<span data-tooltip="Minimum Hz">{Math.round(10**(1+(this.props.freqRange[0]/1000)*3))}Hz</span>
				<span data-tooltip="Maximum Hz">{Math.round(10**(1+(this.props.freqRange[1]/1000)*3))}Hz</span>
			</this.Parameter>
			{/* Bottom Menu */}
			<div className="menu">
				<this.Toggle name="sliders">Sliders</this.Toggle>
				<this.Toggle name="earcons">Earcons</this.Toggle>
				<this.Toggle name="overlay">Overlay</this.Toggle>
				{this.state.focus != 'training' &&
					<a href="#" onClick={this.focus('training')}>Training Videos</a>}
				{this.state.focus == 'training' && 
					<span className="training-videos">
						<a href="#" onClick={this.props.onClickMenu('updown')}>Up/down</a>
						<a href="#" onClick={this.props.onClickMenu('leftright')}>Left/right</a>
						<a href="#" onClick={this.props.onClickMenu('colours')}>Colours</a>
						<a href="#" onClick={this.props.onClickMenu('sunrise')}>Sunrise</a>
						<a href="#" onClick={e => { this.focus()(e); this.props.onClickMenu('camera')(e) }} className="-muted">&larr; Back</a>
					</span>}
			</div>
		</div>
	}
}
