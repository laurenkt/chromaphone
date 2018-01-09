import React          from 'react'
import HilbertOverlay from './HilbertOverlay.js'
import Slider         from 'react-slider'

export default class UI extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated}></canvas>
			<HilbertOverlay order={this.props.hilbertCurveOrder} />
			<Slider
				className="slider -bottom"
				value={this.props.sensitivity}
				step={1}
				min={1}
				max={100}
				onChange={this.props.onSensitivityChange} />
			<Slider
				className="slider -top"
				value={this.props.hilbertCurveOrder}
				step={1}
				min={1}
				max={6}
				onChange={this.props.onHilbertCurveOrderChange} />
			<Slider
				min={1}
				max={1000}
				step={1}
				value={this.props.freqRange}
				onChange={this.props.onFreqRangeChange}
				pearling
				minDistance={10}
				withBars />
		</div>
	}
}
