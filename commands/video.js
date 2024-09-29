const path = require("path");
const axios = require("axios");
const fs = require("fs");

module.exports = {
    name: "video",
    description: "Searches for a video on YouTube.",
    prefixRequired: true,
    adminOnly: false,
    async execute(api, event, args) {
        const { threadID, messageID } = event;

        try {
            const searchQuery = args.join(" ");
            if (!searchQuery) {
                return api.sendMessage(global.convertToGothic("Usage: video <search text>"), threadID, messageID);
            }

            const ugh = await api.sendMessage(global.convertToGothic(`⏱️ | Searching for '${searchQuery}', please wait...`), threadID, messageID);
            api.setMessageReaction("🕥", messageID, () => {}, true);

            const response = await axios.get(`https://chorawrs-sheshh.vercel.app/video?search=${encodeURIComponent(searchQuery)}`);

            const { downloadUrl: videoUrl, title, thumbnail } = response.data;
            const videoPath = path.join(__dirname, "video.mp4");

            const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

            api.setMessageReaction("✅", messageID, () => {}, true);

            await api.sendMessage(
                {
                    body: global.convertToGothic(`Here's your video, enjoy!🥰\n\nTitle: ${title}\nImage: ${thumbnail}`),
                    attachment: fs.createReadStream(videoPath),
                },
                threadID,
                messageID
            );

            fs.unlinkSync(videoPath);
            api.unsendMessage(ugh.messageID);
        } catch (error) {
            console.error(`Error executing video command: ${error}`);
            await api.sendMessage(global.convertToGothic(`Error: ${error.message}`), threadID, messageID);
        }
    },
};
