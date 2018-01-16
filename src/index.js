import {render} from 'react-dom'
import App      from './App.js'

// After page loads
document.addEventListener('DOMContentLoaded', _ => {
	// Create application virtual DOM
	const reactRoot = document.createElement('div')
	render(<App />, reactRoot)
	// Mount application onto web-page DOM
	document.querySelector('body').appendChild(reactRoot)
})

