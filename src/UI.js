import React          from 'react'
import HilbertOverlay from './HilbertOverlay.js'
import Slider         from 'react-slider'

export default class UI extends React.Component {
	constructor(props) {
		super(props)
	}

	// Workaround to cause handles to render properly in React 16
	// https://github.com/mpowaga/react-slider/issues/115
	componentDidMount () {
		setTimeout(() => this.forceUpdate(), 1)
	}

	render() {
		console.log('props', this.props)
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated}></canvas>
			<HilbertOverlay order={this.props.hilbertCurveOrder} />
			<Slider
				className="slider -bottom"
				defaultValue={this.props.sensitivity}
				value={this.props.sensitivity}
				step={1}
				min={1}
				max={99}
				onChange={this.props.onSensitivityChange} />
			<Slider
				className="slider -top"
				defaultValue={this.props.hilbertCurveOrder}
				value={this.props.hilbertCurveOrder}
				step={1}
				min={1}
				max={6}
				onChange={this.props.onHilbertCurveOrderChange} />
			<Slider
				min={1}
				max={1000}
				step={1}
				defaultValue={this.props.freqRange}
				value={this.props.freqRange}
				onChange={this.props.onFreqRangeChange}
				pearling
				minDistance={10}
				withBars />
		</div>
	}
}
