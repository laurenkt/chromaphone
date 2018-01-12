import React          from 'react'
import HilbertOverlay from './HilbertOverlay.js'
import Slider         from 'react-slider'

export default class UI extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			focus: undefined
		}

		this.focus = this.focus.bind(this)
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

			this.setState({focus: key})
		}
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated} onClick={this.focus(undefined)}></canvas>
			<HilbertOverlay order={this.props.hilbertCurveOrder} onClick={this.focus(undefined)} />
			<Slider
				className={`slider ${this.state.focus == 'sensitivity' && '-focus'}`}
				defaultValue={this.props.sensitivity}
				value={this.props.sensitivity}
				step={1}
				min={1}
				max={99}
				onChange={this.state.focus == 'sensitivity' ? this.props.onSensitivityChange : this.focus('sensitivity')}>
				<span>{this.props.sensitivity}%</span>
			</Slider>
			<Slider
				className={`slider ${this.state.focus == 'lightnessCompression' && '-focus'}`}
				defaultValue={this.props.lightnessCompression}
				value={this.props.lightnessCompression}
				step={1}
				min={0}
				max={1000}
				onChange={this.state.focus == 'lightnessCompression' ? this.props.onLightnessCompressionChange : this.focus('lightnessCompression')}>
				<span>{Math.round(this.props.lightnessCompression/10)}%</span>
			</Slider>
			<Slider
				className={`slider ${this.state.focus == 'hilbertCurveOrder' && '-focus'}`}
				defaultValue={this.props.hilbertCurveOrder}
				value={this.props.hilbertCurveOrder}
				step={1}
				min={1}
				max={6}
				onChange={this.state.focus == 'hilbertCurveOrder' ? this.props.onHilbertCurveOrderChange : this.focus('hilbertCurveOrder')}>
				<span>{this.props.hilbertCurveOrder}</span>
			</Slider>
			<Slider
				className={`slider ${this.state.focus == 'freqRange' && '-focus'}`}
				min={1}
				max={1000}
				step={1}
				defaultValue={this.props.freqRange}
				value={this.props.freqRange}
				onChange={this.state.focus == 'freqRange' ? this.props.onFreqRangeChange : this.focus('freqRange')}
				pearling
				minDistance={10}
				withBars>
				<span>{Math.round(10**(1+(this.props.freqRange[0]/1000)*3))}Hz</span>
				<span>{Math.round(10**(1+(this.props.freqRange[1]/1000)*3))}Hz</span>
			</Slider>
			<div className="menu">
				<a href="#">&#x2714; Earcons</a>
				<a href="#">&#x2714; Hilbert Overlay</a>
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
