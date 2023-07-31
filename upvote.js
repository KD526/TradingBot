require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { firefox } = require("playwright");
const ora = require("ora");
const chalk = require("chalk");
const arrayShuffle = require("array-shuffle");
const excelToJson = require("convert-excel-to-json");

let accounts = arrayShuffle(
  excelToJson({
    sourceFile: path.resolve(__dirname, "../accounts.xlsx"),
  }).Sheet1.map(({ A: email, B: password }) => ({ email, password }))
);

const dirLength = fs.readdirSync(path.resolve(__dirname, "./ids")).length;
const commentIds = fs
  .readFileSync(
    path.resolve(__dirname, `./ids/ids_${dirLength - 1}.txt`),
    "utf-8"
  )
  .trim()
  .split("\n");

const CONNECT_URL = "https://accounts.google.com/AddSession";

class Upvote {
  page = null;
  browser = null;
  context = null;
  spinner = null;

  youtubeUrl = null;
  maxNumberOfAccounts = null;
  comments = null;

  async abracadabra(config = null) {
    if (!config) {
      config = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../config.json"), "utf-8")
      );
    }
    this.youtubeUrl = config.youtubeUrl;
    this.maxNumberOfAccounts = config.maxNumberOfAccounts;

    if (
      typeof this.maxNumberOfAccounts === "number" &&
      this.maxNumberOfAccounts > 0
    ) {
      accounts = accounts.slice(0, this.maxNumberOfAccounts);
    }

    await this.launchBrowser();
    this.context = await this.browser.newContext({
      viewport: {
        width: 1920,
        height: 1080,
      },
    });
    this.page = await this.context.newPage();

    for (let i = 0; i < accounts.length; i++) {
      try {
        this.spinnerStart(accounts[i].email + " " + accounts[i].password);

        await this.connect(accounts[i]);

        this.spinnerEnd(accounts[i].email + " " + accounts[i].password);

        for (let j = 0; j < commentIds.length; j++) {
          try {
            this.spinnerStart("upvoting " + `${j + 1}/${commentIds.length}`);

            await this.upvote(commentIds[j]);

            this.spinnerEnd("upvoting " + `${j + 1}/${commentIds.length}`);
          } catch {
            this.spinnerError("upvoting " + `${j + 1}/${commentIds.length}`);
          }
        }
        await this.context.clearCookies();
      } catch {
        this.spinnerError(accounts[i].email + " " + accounts[i].password);
        continue;
      }
    }
    await this.close();
  }

  async connect(account) {
    await this.page.goto(CONNECT_URL, {
      waitUntil: "load",
    });

    await this.page.waitForTimeout(5000);

    await this.page.keyboard.type(account.email);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(5000);

    await this.page.keyboard.type(account.password);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(5000);
  }

  async upvote(commentId) {
    await this.page.goto(`${this.youtubeUrl}&lc=${commentId}`, {
      waitUntil: "load",
    });

    await this.page.waitForTimeout(5000);

    await this.page.evaluate(async () => {
      window.scrollBy(0, 1000);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      document.querySelector("#like-button").click();
    });

    await this.page.waitForTimeout(5000);
  }

  async launchBrowser() {
    this.browser = await firefox.launch({
      headless: false,
      args: ["--disable-features=site-per-process", "--no-sandbox"],
    });
  }

  async close() {
    await this.browser.close();
  }

  spinnerStart(message) {
    this.spinner = ora().start(message);
  }

  spinnerError(message) {
    this.spinner.fail(chalk`{red ${message}}`);
  }

  spinnerEnd(message) {
    this.spinner.succeed(chalk`{green ${message}}`);
  }
}

module.exports = { Upvote };
