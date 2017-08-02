const express = require('express')
const app = express()
const request = require('superagent')
const ytdl = require('ytdl-core')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const utils = require('./utils.js')

app.set('port', (process.env.PORT || 4000));

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
					res.set('Access-Control-Allow-Origin', '*')
					res.status(200).send(items)
				}
			})
	}
})

app.get('/:action(download|stream)/video/:videoId', (req, res) => {

	const isDownloadRequest = utils.isDownloadRequest(req.params.action)

	const videoId = req.params.videoId
	//let videoReadableStream = utils.getVideoReadableStream(videoId)
	utils.getVideoMetaData(videoId).then((info) => {
		const fileName = info.title +'.mp4' //TODO: update this to include video title

		if (isDownloadRequest) {
			res.set('Content-disposition', 'attachment; filename=' + fileName)
		}

		res.set('Content-Type', 'video/mp4')
		ytdl.downloadFromInfo(info).pipe(res)

	}, (err) => {
		console.log("YTDL ERROR : Error in getting video metadata")
		res.status(500).send({ error: err.toString() })
	})
})

app.get('/:action(download|stream)/audio/:videoId', (req, res) => {
	
	const isDownloadRequest = utils.isDownloadRequest(req.params.action)

	const videoId = req.params.videoId
	//let videoReadableStream = utils.getVideoReadableStream(videoId)
	utils.getVideoMetaData(videoId).then((info) => {

		const fileName = info.title+'.mp3' //TODO: update this to include video title

		let videoReadableStream = ytdl.downloadFromInfo(info)
		ffmpeg(videoReadableStream)
			//.input(info.thumbnail_url)
			.outputOptions([
				'-metadata artist='+info.author.name,
			])
			.format('mp3')
			.on('start', (cmdLine) => {
				console.log('[ffmpeg] Starting audio conversion')
				res.set('Content-Type', 'audio/mpeg')
				if (isDownloadRequest) {
					res.set('Content-disposition', 'attachment; filename="' + fileName+ '"')
				}
			})
			.on('error', (err) => {
				console.log('[ffmpeg] Error while converting to audio: ', err.toString())
			})
			.on('end', () => {
				console.log('[ffmpeg] Audio conversion finished')
			})
			.pipe(res)

	}, (err) => {
		console.log("YTDL ERROR : Error in getting video metadata")
		res.status(500).send({ error: err.toString() })
	})

})

app.listen(app.get('port'), () => {
	console.log('Youtube server listening on' , app.get('port'))
});