import React from 'react'
import generateStereoHilbertCurveOfSize from './hilbertCurve.js'

/**
 * Draws a Hilbert Curve on-screen
 */
export default class HilbertOverlay extends React.Component {
	constructor(props) {
		super(props)

		this.drawCanvas = this.drawCanvas.bind(this)
	}

	drawCanvas(canvas) {
		// Sometimes this is invoked without a DOM element to draw to. Abort.
		if (!canvas)
			return

		// Track the last used canvas to reference when a force-redraw is needed
		this.canvas = canvas

		// Number of pixels
		const size = (2**this.props.order)**2*2

		// Use a huge image and scale down, looks better
		const w = canvas.width  = 3840
		const h = canvas.height = 2160

		const curve = generateStereoHilbertCurveOfSize(size)
		const ctx   = canvas.getContext('2d')
		ctx.strokeStyle = 'white'
		ctx.lineWidth   = 4

		const width   = Math.sqrt(size/2)
		const xbuffer = (w / width)
		const ybuffer = (h / width)

		const toX = k => {
			return k % width
		}

		const toY = k => {
			return (k - (k % width)) / width
		}

		ctx.clearRect(0, 0, w, h)
		ctx.beginPath()

		/*
		 * Do the same drawing for both sides
		 */

		for(let i = 0; i < curve.length / 2 -1; i++) {
			const x = k => (toX(k) / (width-1)) * (w/2 - xbuffer/2) + xbuffer/4,
			      y = k => (toY(k) / (width-1)) * (h   - ybuffer)   + ybuffer/2

			ctx.moveTo(x(curve[i]), y(curve[i]))
			ctx.lineTo(x(curve[i+1]), y(curve[i+1]))
		}

		for(let i = curve.length / 2; i < curve.length; i++) {
			const x = k => (toX(k - size/2) / (width-1)) * (w/2 - xbuffer/2) + xbuffer/4 + w/2,
			      y = k => (toY(k - size/2) / (width-1)) * (h   - ybuffer) + ybuffer/2

			ctx.moveTo(x(curve[i]), y(curve[i]))
			ctx.lineTo(x(curve[i+1]), y(curve[i+1]))
		}

		ctx.stroke()
	}

	render() {
		if (this.canvas)
			this.drawCanvas(this.canvas) // re-render to canvas

		return <canvas className="hilbert" ref={this.drawCanvas} {...this.props} />
	}
}
