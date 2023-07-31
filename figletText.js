const figlet = require("figlet");
const chalk = require("chalk");

const figletText = async (text, type) => {
  await new Promise((resolve, reject) => {
    figlet.text(text, type, (error, data) => {
      if (error) {
        reject(error);
      } else {
        console.log(chalk`{magenta.bold ${data}}`);
        resolve();
      }
    });
  });
};

module.exports = { figletText };
