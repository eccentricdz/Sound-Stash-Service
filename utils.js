const ytdl = require('ytdl-core')
const youtubeUrl = 'https://www.youtube.com/watch?v='

const youtubeServerUtils = {
	getVideoReadableStream: function(videoId) {
		const videoUrl = youtubeUrl + videoId
		let videoReadableStream = ytdl(videoUrl)

		return videoReadableStream
	},
	isDownloadRequest: function(action) {
		return action === 'download'
	},
	getVideoMetaData: function(videoId) {
		const videoUrl = youtubeUrl + videoId
		let promise = ytdl.getInfo(videoUrl)

		return promise
	}
}

module.exports = youtubeServerUtils