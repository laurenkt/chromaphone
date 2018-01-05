export default function generateStereoHilbertCurveOfSize(size) {
	let xs = new Float32Array(size)
	const n = size/2
	const width = Math.sqrt(n)

	for (let y = 0; y < width; y += 2) {
		for (let x = 0; x < width; x += 2) {
			const i = y*width + x

			xs.buffer[i]         = i+1
			xs.buffer[i+1]       = i+width+1
			xs.buffer[i+width]   = i
			xs.buffer[i+width+1] = i+width+2
		}
	}

	for (let y = 0; y < width; y += 4) {
		for (let x = 0; x < width; x += 4) {
			const i = y*width + x
			
			xs.buffer[i+width+width+width+1] = i+width
			xs.buffer[i+width+3] = i+width+width+width+2
		}

		xs.buffer[(y+4)*width - 1] = (y+7)*width
	}

	function swap(i1, i2) {
		const tmp = xs.buffer[i1]
		xs.buffer[i1] = xs.buffer[i2]
		xs.buffer[i2] = tmp

		for (let i = 0; i < n; i++) {
			if (xs.buffer[i] == i1)
				xs.buffer[i] = i2
			else if (xs.buffer[i] == i2)
				xs.buffer[i] = i1
		}
	}

	function transposeL(origin, w) {
		for (let y = 0; y < w; y++) {
			for (let x = 0; x < w; x++) {
				if (y >= w-x-1)
					continue;

				const i1 = origin + y*width + x
				const i2 = origin + (w-x-1)*width + (w-y-1)

				swap(i1, i2)
			}
		}
	}

	function transposeR(origin, w) {
		for (let y = 0; y < w; y++) {
			for (let x = 0; x < w; x++) {
				if (y <= x)
					continue;

				const i1 = origin + y*width + x
				const i2 = origin + x*width + y

				swap(i1, i2)
			}
		}
	}

	for (let y = 0; y < width; y += 4) {
		for (let x = 0; x < width; x += 4) {
			const i = y*width + x

			transposeL(i+width+width,   2)
			transposeR(i+width+width+2, 2)
		}
	}

	for (let y = 0; y < width; y += 8) {
		for (let x = 0; x < width; x += 8) {
			const i = y*width + x

			//transposeL(i+width+width,   4)
			//transposeR(i+width+width+2, 4)
		}
	}

	return xs
}
