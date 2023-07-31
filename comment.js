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
//console.log(accounts);

const CONNECT_URL = "https://accounts.google.com/AddSession";

class Comment {
  page = null;
  browser = null;
  context = null;
  spinner = null;
  dirLength = null;

  youtubeUrl = null;
  maxNumberOfAccounts = null;
  comments = null;

  async abracadabra(config = null) {
    this.dirLength = fs.readdirSync(path.resolve(__dirname, "./ids")).length;

    if (!config) {
      config = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../config.json"), "utf-8")
      );
    }
    this.youtubeUrl = config.youtubeUrl;
    this.maxNumberOfAccounts = config.maxNumberOfAccounts;
    this.comments = config.comments;

    if (
      typeof this.maxNumberOfAccounts === "number" &&
      this.maxNumberOfAccounts > 0
    ) {
      accounts = accounts.slice(0, this.maxNumberOfAccounts);
    }

    this.comments = arrayShuffle(this.comments);

    await this.launchBrowser();
    this.context = await this.browser.newContext({
      viewport: {
        width: 1920,
        height: 1080,
      },
    });
    this.page = await this.context.newPage();

    this.page.on("request", async (request) => {
      if (
        request.url().includes("https://www.youtube.com/youtubei/v1/att/get")
      ) {
        try {
          fs.appendFileSync(
            path.resolve(__dirname, `./ids/ids_${this.dirLength}.txt`),
            `${JSON.parse(request.postData()).ids[0].commentId}\n`
          );
        } catch (error) {
          fs.writeFileSync(
            path.resolve(__dirname, `./ids/ids_${this.dirLength}.txt`),
            `${JSON.parse(request.postData()).ids[0].commentId}\n`
          );
        }
      }
    });

    for (let i = 0; i < accounts.length; i++) {
      try {
        this.spinnerStart(accounts[i].email + " " + accounts[i].password);

        await this.connect(accounts[i]);
        await this.like();
        await this.comment(this.comments[i % this.comments.length]);
        await this.context.clearCookies();
        this.spinnerEnd(accounts[i].email + " " + accounts[i].password);
      } catch (error) {
        console.log(error);
        this.spinnerError(accounts[i].email + " " + accounts[i].password);
        continue;
      }
    }

    await this.close();
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  async connect(accounts) {
    await this.page.goto(CONNECT_URL, {
      waitUntil: "load",
    });

    await this.page.waitForTimeout(5000);

    await this.page.keyboard.type(accounts.email);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(4000);

    await this.page.keyboard.type(accounts.password);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(5000);
  }

  async like() {
    await this.page.goto(this.youtubeUrl, {
      waitUntil: "load",
    });

    await this.page.waitForTimeout(5000);

    await this.page.evaluate(() => {
      document
        .querySelectorAll(
          "#top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(1)"
        )[0]
        .click();
    });
  }

  async comment(comment) {
    await this.page.evaluate(() => {
      window.scrollBy(0, 700);
    });

    await this.page.waitForTimeout(5000);

    await this.page.click("#placeholder-area");
    await this.page.waitForTimeout(5000);
    await this.page.type("#contenteditable-root", comment);
    await this.page.waitForTimeout(5000);
    await this.page.click("#submit-button");

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

module.exports = { Comment };
