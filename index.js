const { schedule } = require("node-cron");
const { Comment } = require("./comment");
const { Upvote } = require("./upvote");
const { figletText } = require("./figletText");
const { bot } = require("./bot");
const { connect } = require("mongoose");
require("dotenv").config();

const { mostPopular } = require("./mostPopular");
const cron = require("node-cron");

if (!process.env.DB_URL) {
  throw new Error("DB_URL, Must be defined in your .env FILE");
}

const Main = async () => {
  await figletText("YoutubeBooster", "Larry 3D").then(async () => {
    console.log(`---`.repeat(10));
    try {
      bot.stop();
    } catch (err) { }

    console.log("Connecting to telegram bot...\n---");

    await bot
      .launch()
      .then((result) => {
        console.log("Connected to telegram bot!");
      })
      .catch(async (err) => {
        let error = JSON.parse(JSON.stringify(err));
        console.log("Telegram Error:", error?.message);
      })
      .catch((error) => {
        console.log("Telegram error:", error);
      });
    console.log(`---`.repeat(10));
    console.log("Connecting to MongoDb...\n---");
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      keepAlive: true,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    };

    await connect(process.env.DB_URL, options)
      .then((result) => {
        console.log("Connected to MongoDb :)");
      })
      .catch(async (err) => {
        let error = JSON.parse(JSON.stringify(err));
        console.log("Mongo Error:", err);
      });
    console.log(`---`.repeat(10));

    if (process.argv.includes("--local")) {
      // comment
      const comment = new Comment();
      await comment.abracadabra();

      // upvote
      const upvote = new Upvote();
      await upvote.abracadabra();
    }
  });

  //scan for trending videos periodically
  const TRENDING_VIDEO_CHECK_INTERVAL =
    process.env.TRENDING_VIDEO_CHECK_INTERVAL || 1;
  console.log(`Setting up trending videos scheduler...`);
  console.log(`---`.repeat(1));
  schedule(`*/${TRENDING_VIDEO_CHECK_INTERVAL} * * * * `, async () => {
    console.log(`---`.repeat(10));
    let message = `Checking trending videos every ${TRENDING_VIDEO_CHECK_INTERVAL} minutes...\n`;

    const mostPopularVideo = mostPopular();
    if (mostPopularVideo) {
      console.log(message + mostPopularVideo.title, mostPopularVideo.link);

      // send to telegram channel;
    }
  });
  console.log(`Setting schedulers done!`);
  console.log(`---`.repeat(10));
};

Main();
