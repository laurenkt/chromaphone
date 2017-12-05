export default class Monitor {
	constructor(canvas, buffer) {
		this.canvas = canvas
		this.canvas.width = 3072
		this.canvas.height = 480

		this.buffer = buffer
		this.context = this.canvas.getContext('2d')

		this.updateGraph = this.updateGraph.bind(this)

		setInterval(this.updateGraph, 100)
	}

	updateGraph() {
		const ctx = this.context

		ctx.clearRect(0, 0, 3072, 480)
		ctx.beginPath()
		ctx.moveTo(0, 240)

		for(let i = 0; i < this.canvas.width; i++) {
			ctx.lineTo(i, 240 + this.buffer[Math.round(i)] * 480)
		}

		ctx.lineTo(this.canvas.width-1, 240)
		ctx.fill()

		
	}
}
