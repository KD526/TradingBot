const { google } = require("googleapis");
const axios = require("axios");
const { Telegraf } = require("telegraf");
require("dotenv").config();
const { schedule } = require("node-cron");

const keywords = require("../src/keywords");

const service = google.youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY || "AIzaSyCcwDmwrqi-9Yti3u5WJpL6dURX-DVPZgI",
});

const TRENDING_VIDEO_CHECK_INTERVAL =
  process.env.TRENDING_VIDEO_CHECK_INTERVAL || 1;

const mostPopular = schedule(
  `*/${TRENDING_VIDEO_CHECK_INTERVAL} * * * * `,
  async function main(params) {
    const chartInput = "mostPopular";
    const res = await service.videos.list(
      {
        part: ["snippet, contentDetails, statistics"],
        chart: chartInput,
        //videoCategoryId: " ", //returns category numbers.
        regionCode: "", //USA
        maxResults: 50,
        order: "relevance",
      },
      (err, res) => {
        let mostPopularVideos = null;
        if (err) return console.log("The API returned an error: " + err);
        const videos = res.data.items; //API Response

        if (videos.length) {
          console.log("mostPopular Videos:\n ");

          const videoInfo = videos.map((video) => {
            let link = ` https://www.youtube.com/watch?v=${video.id}`;
            let title = `${video.snippet.title}`;
            //console.log(title, link);

            let newData = keywords.some((v) => title.toLowerCase().includes(v));
            if (newData == true) {
              const matchedVideo = `${title} , ${link} \n`;
              console.log(matchedVideo);
              mostPopularVideos = {
                title,
                link,
              };
            }
          });
        } else {
          console.log("No Videos found!");
        }

        return mostPopularVideos;
      }
    );
  }
);

module.exports = { mostPopular };
