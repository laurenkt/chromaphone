import React       from 'react'
import {render}    from 'react-dom'
import Sonifier    from './Sonifier.js'
import Monitor     from './Monitor.js'
import VideoSource from './VideoSource.js' 

class UI extends React.Component {

}

// Don't add charts until page has loaded
document.addEventListener('DOMContentLoaded', _ => {
	const sonifier = new Sonifier(3072)

	const videoSource = new VideoSource(
		document.querySelector('video'),
		document.querySelector('canvas#video'),
		sonifier.targets.buffer
	)

	sonifier.start()

	const monitor = new Monitor(document.getElementById('graph'), sonifier.targets.buffer)
})

