import React from 'react'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

export default class HilbertOverlay extends React.Component {
	constructor(props) {
		super(props)
	}

	drawCanvas(canvas) {
		canvas.width = 1000
		canvas.height = 1000

		const curve = generateStereoHilbertCurveOfSize(this.props.size)
		const ctx   = canvas.getContext('2d')
		ctx.strokeStyle = 'white'

		const width = Math.sqrt(this.props.size/2)
		const buffer = (1000 / width)

		const toX = k => {
			return k % width
		}

		const toY = k => {
			return (k - (k % width)) / width
		}

		ctx.clearRect(0, 0, 1000, 1000)
		ctx.beginPath()

		for(let i = 0; i < curve.length / 2 -1; i++) {
			const x = k => (toX(k) / (width-1)) * (500 - buffer/2) + buffer/4,
			      y = k => (toY(k) / (width-1)) * (1000 - buffer) + buffer/2

			ctx.moveTo(x(curve[i]), y(curve[i]))
			ctx.lineTo(x(curve[i+1]), y(curve[i+1]))
		}

		for(let i = curve.length / 2; i < curve.length; i++) {
			const x = k => (toX(k - this.props.size/2) / (width-1)) * (500 - buffer/2) + buffer/4 + 500,
				y = k => (toY(k - this.props.size/2) / (width-1)) * (1000 - buffer) + buffer/2

			ctx.moveTo(x(curve[i]), y(curve[i]))
			ctx.lineTo(x(curve[i+1]), y(curve[i+1]))
		}

		ctx.stroke()
	}

	render() {
		return <canvas className="hilbert" ref={this.drawCanvas.bind(this)} />
	}
}
