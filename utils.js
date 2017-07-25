const ytdl = require('ytdl-core')
const youtubeUrl = 'https://www.youtube.com/watch?v='

const youtubeServerUtils = {
	getVideoReadableStream: function(videoId) {
		const videoUrl = youtubeUrl + videoId
		let videoReadableStream = ytdl(videoUrl)

		return videoReadableStream
	}
}

module.exports = youtubeServerUtils