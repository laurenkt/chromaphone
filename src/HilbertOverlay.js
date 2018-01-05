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

		for(let i = 0; i < curve.length / 2; i++) {
			const x = k =>(toX(k) / (width-1)) * (500 - buffer/2) + buffer/4,
			      y = k => (toY(k) / (width-1)) * (1000 - buffer) + buffer/2

			console.log(`curve(${i}) = ${curve.buffer[i]} = (${toX(curve.buffer[i])}, ${toY(curve.buffer[i])})`)
			ctx.moveTo(x(i), y(i))
			ctx.lineTo(x(curve.buffer[i]), y(curve.buffer[i]))
			ctx.arc(x, y, 5, 0, 2*Math.PI)
			ctx.strokeText(i, x, y)
		}

			/*
		for(let i = curve.length / 2; i < curve.length; i++) {
			console.log(`curve(${i}) = ${curve.buffer[i]} = (${toX(curve.buffer[i])}, ${toY(curve.buffer[i])})`)
			ctx.lineTo(
				(toX(curve.buffer[i]) / Math.sqrt(this.props.size/2)) * 500 + 500,
				(toY(curve.buffer[i]) / Math.sqrt(this.props.size/2)) * 1000
			)
		}*/

		ctx.stroke()
	}

	render() {
		return <canvas className="hilbert" ref={this.drawCanvas.bind(this)} />
	}
}
