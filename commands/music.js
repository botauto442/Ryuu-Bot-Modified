const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'music',
    description: 'Searches for a song and sends a Spotify music preview as a voice attachment.',
    prefixRequired: false,
    adminOnly: false,
    async execute(api, event, args) {
        const query = args.join(' ');

        if (!query) {
            return api.sendMessage(global.convertToGothic('Please provide a song name to search for.'), event.threadID, event.messageID);
        }

        const searchUrl = `https://spotifydl-api-54n8.onrender.com/spotifydl?search=${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(searchUrl);
            const results = response.data.result;

            if (results.length === 0) {
                return api.sendMessage(global.convertToGothic('No results found for your query.'), event.threadID, event.messageID);
            }

            const track = results[0];
            const trackTitle = track.title;
            const trackArtist = track.artist;
            const previewUrl = track.direct_url;

            const audioPath = path.resolve(__dirname, `${trackTitle}-${trackArtist}.mp3`);
            const writer = fs.createWriteStream(audioPath);

            const previewResponse = await axios({
                url: previewUrl,
                method: 'GET',
                responseType: 'stream'
            });

            previewResponse.data.pipe(writer);

            writer.on('finish', async () => {
                const attachment = fs.createReadStream(audioPath);
                await api.sendMessage({
                    body: global.convertToGothic(`🎶 Now Playing: ${trackTitle} by ${trackArtist}`),
                    attachment
                }, event.threadID, () => {
                    fs.unlinkSync(audioPath);
                });
            });

            writer.on('error', err => {
                console.error('Error writing audio file:', err);
                api.sendMessage(global.convertToGothic('Failed to download the audio preview.'), event.threadID, event.messageID);
            });

        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage(global.convertToGothic('An error occurred while processing your request.'), event.threadID, event.messageID);
        }
    },
};
