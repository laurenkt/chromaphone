import React          from 'react'
import HilbertOverlay from './HilbertOverlay.js'
import Slider         from 'react-slider'
import {Players}      from 'tone'

export default class UI extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			focus: undefined,
			overlay: true,
			earcons: true,
		}

		this.earconPlayers = new Players({
			'sensitivity':          'assets/sensitivity.aac',
			'freqRange':            'assets/freqRange.aac',
			'hilbertCurveOrder':    'assets/hilbertCurveOrder.aac',
			'lightnessCompression': 'assets/lightnessNormalisation.aac',
			'audioCompression':     'assets/compression.aac',
			'colorVolume':          'assets/colorVolume.aac',
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

	focus(key) {
		return e => { 
			if (e.preventDefault)
				e.preventDefault()

			if (this.state.earcons && this.earconPlayers.has(key))
				this.earconPlayers.get(key).start()

			this.setState({focus: key})
		}
	}
	
	Parameter({name, min, max, children, tooltip, ...props}) {
		return <Slider
			{...props}
			className={`slider ${this.state.focus == name && '-focus'}`}
			defaultValue={this.props[name]}
			value={this.props[name]}
			step={1}
			min={min}
			max={max}
			onChange={this.state.focus == name ? this.props.onChange(name) : this.focus(name)}>
			{children ||
				<span data-tooltip={tooltip}>{Math.floor(100* ((this.props[name]-min) / (max-min)))}%</span>}
		</Slider>
	}

	Toggle({name, children}) {
		return <a
			href="#"
			className={this.state[name] ? '-enabled' : '-disabled'}
			onClick={e => { e.preventDefault(); this.setState({[name]: !this.state[name]}) }}>
			{this.state[name] && <span>&#x2714;</span> || <span>&#x2718;</span>} {children}
		</a>
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated} onClick={this.focus(undefined)}></canvas>
			{this.state.overlay && 
				<HilbertOverlay order={this.props.hilbertCurveOrder} onClick={this.focus(undefined)} />}
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
			<div className="menu">
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
