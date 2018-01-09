export default function generateStereoHilbertCurveOfSize(size) {
	let xs = new Float32Array(size)
	xs.fill(NaN)
	const n = size/2
	const width = Math.sqrt(n)

	for (let y = 0; y < width; y += 2) {
		for (let x = 0; x < width; x += 2) {
			const i = y*width + x

			xs[i]         = i+1
			xs[i+1]       = i+width+1
			xs[i+width]   = i
			xs[i+width+1] = NaN//i+width+2
		}
	}

	function swap(i1, i2) {
		const tmp = xs[i1]
		xs[i1] = xs[i2]
		xs[i2] = tmp

		for (let i = 0; i < n; i++) {
			if (xs[i] == i1)
				xs[i] = i2
			else if (xs[i] == i2)
				xs[i] = i1
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

	if (width >= 4) {

		for (let y = 0; y < width; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const i = y*width + x
				
				xs[i+width+1] = i+width+2
				xs[i+width+width+width+1] = i+width
				xs[i+width+3] = i+width+width+width+2
			}

			xs[(y+4)*width - 1] = NaN// (y+7)*width
		}
		


		for (let y = 0; y < width; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const i = y*width + x

				transposeL(i+width+width,   2)
				transposeR(i+width+width+2, 2)
			}

			//xs[y*widthI]
		}

		
		for (let inc = 4; inc < width; inc *= 2) {
			for (let y = 0; y < width; y += inc*2) {
				for (let x = 0; x < width; x += inc*2) {
					const i = y*width + x

					transposeL(i+width*inc,     inc)
					transposeR(i+width*inc+inc, inc)
					xs[i+width*inc]           = i+width*(inc-1)
					xs[i+width*(inc-1)+(inc-1)]   = i+width*(inc-1)+inc
					xs[i+width*(inc-1)+(inc*2-1)] = i+width*inc+(inc*2-1)
				}
			} 
		
		}

			/*
		if (width >= 8) {

			for (let y = 0; y < width; y += 8) {
				for (let x = 0; x < width; x += 8) {
					const i = y*width + x

					transposeL(i+width*4,   4)
					transposeR(i+width*4+4, 4)
					xs[i+width*4]   = i+width*3
					xs[i+width*3+3] = i+width*3+4
					xs[i+width*3+7] = i+width*4+7
				}
			} 

			if (width >= 16) {

				for (let y = 0; y < width; y += 16) {
					for (let x = 0; x < width; x += 16) {
						const i = y*width + x

						transposeL(i+width*8,   8)
						transposeR(i+width*8+8, 8)
						xs[i+width*8]    = i+width*7
						xs[i+width*7+7]  = i+width*7+8
						xs[i+width*7+15] = i+width*8+15
					}
				}

			}

		}*/

	}

	// Produce right-side image, copy, then revert
	transposeR(0, width)
	for (let i = 0; i < n; i++) {
		xs[i+n] = xs[i] + n
	}
	transposeR(0, width)

	// Rotate left side image
	transposeL(0, width)

	function find_index_of_first_node(start) {
		// Find starting node
		const nodes_with_inbound_edges = new Uint8Array(n)
		for (let i = 0; i < n; i++) {
			// Adjust depending on offset
			nodes_with_inbound_edges[xs[start+i] - start] = true
		}
		return nodes_with_inbound_edges.findIndex(node => !node) + start
	}

	let left_idx  = find_index_of_first_node(0)
	let right_idx = find_index_of_first_node(n)
	// Construct mapping
	const mapping = new Uint16Array(size)
	for (let i = 0; i < n; i++) {
		mapping[i]   = left_idx
		mapping[size-i-1] = right_idx
		left_idx     = xs[left_idx]
		right_idx    = xs[right_idx]
	}

	return mapping
}
