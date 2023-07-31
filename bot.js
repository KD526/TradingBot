const { Telegraf } = require("telegraf");
const { User } = require("./models/user");
const { connect } = require("mongoose");
const { Comment } = require("./comment");
const { Upvote } = require("./upvote");
require("dotenv").config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN, Must be defined in your .env FILE");
}

/**
 *
 * @param params.id User's telegram id;
 * @param params.is_bot User type;
 * @param params.first_name User's first name;
 * @param params.last_name User's last name;
 * @param params.username User's telegram username;
 * @returns userObject
 */
const getOrCreateUser = async (context) => {
  const params = context.message?.from
    ? context?.message?.from
    : context.update?.message.from;

  const { id, is_bot, first_name, last_name, username } = params;

  const user = await User.findOne({ tg_id: id, bot_name: context.me });

  if (user) {
    return user;
  } else {
    const new_user = new User({
      tg_id: id,
      is_bot: is_bot,
      first_name: first_name,
      last_name: last_name,
      username: username,
      bot_name: context.me,
    });
    await new_user.save();

    return await User.findOne({ tg_id: id });
  }
};

let getUserInput = async (User, ctx, text = undefined) => {
  try {
    let details = text.split(",");
    details = details.map((item) => {
      return item.trim();
    });
    details = details.filter(Boolean);

    let youtubeLink = details[0];
    let maxNumberOfAccounts = isNaN(parseFloat(details[1]))
      ? 0
      : parseFloat(details[1]);
    let comments = details.slice(2);

    console.log(youtubeLink, maxNumberOfAccounts, comments);

    // validate youtubeLink
    const youtubeMatch = youtubeLink.match(
      /(?:https?:\/\/)?(?:(?:www\.)?youtube.com\/watch\?v=|youtu.be\/)(\w+)/g
    );

    if (!youtubeMatch) {
      return ctx.reply(`Invalid youtube link: ${text}`);
    }

    // check for comments
    if (comments.length == 0) {
      let format = `Youtube link, max number of accounts, comments`;
      format += `\n*E.g* https://www.youtube.com/watch?v=hLqw8IyIeIk, 2, comment1`;
      return ctx.replyWithMarkdown(
        `No comments provided. Please retry again in this format.\n${format}`,
        { disable_web_page_preview: true }
      );
    }

    const config = {
      youtubeUrl: youtubeMatch[0],
      maxNumberOfAccounts: maxNumberOfAccounts,
      comments: comments,
    };
    // call the YT booster bot
    const comment = new Comment();
    ctx.replyWithMarkdown(
      `Bot has started commenting on video ${youtubeMatch[0]}, this may take sometime...`,
      { disable_web_page_preview: true }
    );
    await comment.abracadabra(config);
    ctx.reply(`Commenting process complete!`);
    ctx.reply(`Initiating upvoting process...`);
    const upvote = new Upvote();
    await upvote.abracadabra(config);
    ctx.reply(`Upvoting process complete!`);
  } catch (error) {
    console.error(error);
  }
  if (!text) {
    ctx.reply(`Message can't be empty!`);
  }
};

/**
 * Bot
 */
let bot = new Telegraf(process.env.BOT_TOKEN);

/** middlewares */
bot.use(async (ctx, next) => {
  try {
    const user = await getOrCreateUser(ctx.message?.from ? ctx : ctx);

    if (!user.is_active) {
      return ctx.reply(`Please contact @dev to activate your account.`);
    } else {
      await next();
      return;
    }
  } catch (error) {
    console.log(error);
  }
});
bot.start(async (ctx) => {
  const user = await getOrCreateUser(ctx);
  const defaultMessage = `Hello ${user?.username ? user.username : user?.last_name
    }, welcome to ${ctx.me}`;
  return ctx.reply(defaultMessage);
});
bot.on("text", async (ctx) => {
  const user = await getOrCreateUser(ctx);
  await getUserInput(user, ctx, ctx.message.text);
});

bot.command(`/config`, async (ctx) => {
  const user = await getOrCreateUser(ctx);
  let text = ctx.message.text;
  console.log("text", text);
});
const sendTelegramMessage = async (user, message) => {
  try {
    await bot.telegram.sendMessage(
      user,
      message
        .replaceAll("_", "\\_")
        .replaceAll(".", "\\.")
        .replaceAll("{", "\\{")
        .replaceAll("}", "\\}")
        .replaceAll("|", "\\|")
        .replaceAll("=", "\\=")
        .replaceAll("+", "\\+")
        .replaceAll(">", "\\>")
        .replaceAll("<", "\\<")
        .replaceAll("-", "\\-")
        .replaceAll("!", "\\!"),
      {
        parse_mode: "MarkdownV2",
      }
    );
  } catch (error) {
    console.error(`Error:`, error);
  }
};

module.exports = { bot, sendTelegramMessage };
