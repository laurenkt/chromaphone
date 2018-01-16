import React    from 'react'
import {render} from 'react-dom'
import App      from './App.js'

document.addEventListener('DOMContentLoaded', _ => {
	const reactRoot = document.createElement('div')
	render(<App />, reactRoot)
	document.querySelector('body').appendChild(reactRoot)
})

