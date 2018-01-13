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
		this.Parameter = this.Parameter.bind(this)
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
	
	Parameter({name, min, max, children, ...props}) {
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
				<span>{Math.floor(100* ((this.props[name]-min) / (max-min)))}%</span>}
		</Slider>
	}

	render() {
		return <div className="ui">
			<canvas ref={this.props.onViewportCanvasCreated} onClick={this.focus(undefined)}></canvas>
			<HilbertOverlay order={this.props.hilbertCurveOrder} onClick={this.focus(undefined)} />
			<this.Parameter name="sensitivity" min={1} max={100} />
			<this.Parameter name="lightnessCompression" min={0} max={1000} />
			<this.Parameter name="audioCompression" min={0} max={1000} />
			<this.Parameter name="hilbertCurveOrder" min={1} max={6}>
				<span>{this.props.hilbertCurveOrder}</span>
			</this.Parameter>
			<this.Parameter name="colorVolume" min={0} max={1000} />
			<this.Parameter name="freqRange" min={1} max={1000} pearling minDistance={10}>
				<span>{Math.round(10**(1+(this.props.freqRange[0]/1000)*3))}Hz</span>
				<span>{Math.round(10**(1+(this.props.freqRange[1]/1000)*3))}Hz</span>
			</this.Parameter>
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
