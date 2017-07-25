const express = require('express')
const app = express()
const request = require('superagent')
const ytdl = require('ytdl-core')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const utils = require('./utils.js')

app.set('port', (process.env.PORT || 3000));

const googleAPIKey = 'AIzaSyBHkEhkd1LdrFinHC7GnKNPQjKU0BYslfs'
const youtubeDataAPIUrl = 'https://www.googleapis.com/youtube/v3/search'
const youtubeUrl = 'https://www.youtube.com/watch?v='

app.get('/search/:query', (req, res) => {
	if (req.params.query && req.params.query != '') {
		request
			.get(youtubeDataAPIUrl)
			.query({'part': 'snippet'})
			.query({'q': req.params.query})
			.query({'key': googleAPIKey})
			.end((err, result) => {
				if (err || !result.ok) {
					res.status(500).send({ error: 'There was some error is fetching the results from the Youtube API' })
				}
				else {
					const jsonResponse = JSON.parse(result.text)
					const items = jsonResponse.items
					res.status(200).send(items)
				}
			})
	}
})

app.get('/download/video/:videoId', (req, res) => {

	const videoId = req.params.videoId
	let videoReadableStream = utils.getVideoReadableStream(videoId)
	const videoFile = fs.createWriteStream(videoId+'.mp4')

	videoFile.on('finish', () => {
		res.download(videoId+'.mp4')
	})

	videoReadableStream.pipe(videoFile)

})

app.get('/download/audio/:videoId', (req, res) => {

	const videoId = req.params.videoId
	let videoReadableStream = utils.getVideoReadableStream(videoId)

	ffmpeg()
		.input(videoReadableStream)
		.output('audio.mp3')
		.on('end', () => {
			res.download('audio.mp3')
		})
		.on('error', (err) => {
			console.log('[ffmpeg] error while converting to audio: ', err.code, err.msg)
			res.status(500).send({ error: '[ffmpeg] error while converting to audio' })
		}).run()
})

app.get('/stream/audio/:videoId', (req, res) => {
	const videoId = req.params.videoId
	let videoReadableStream = utils.getVideoReadableStream(videoId)

	ffmpeg(videoReadableStream)
		.format('mp3')
		.on('start', (cmdLine) => {
			console.log('[ffmpeg] Starting audio conversion')
			res.set('Content-Type', 'audio/mpeg')
		})
		.on('error', (err) => {
			console.log('[ffmpeg] Error while converting to audio: ', err.code, err.msg)
		})
		.on('end', () => {
			console.log('[ffmpeg] Audio conversion finished')
		})
		.pipe(res)

})

app.listen(app.get('port'), () => {
	console.log('Youtube server listening on' , app.get('port'))
});