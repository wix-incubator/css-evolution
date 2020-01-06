const chromium = require("chrome-aws-lambda");
const genetic = require("fs").readFileSync("./public/genetic.js");

let browserReady = null;
function getBrowser() {
  browserReady =
    browserReady ||
    new Promise(async resolve => {
      const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless
      });
      resolve(browser);
    });
  return browserReady;
}
module.exports = async function evolve({ timeout, semantic, legacy, style, pre, initial }) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  page.evaluate(`(() => {
        ${genetic};
        window.geneticCSS = geneticCSS;
    })()`);
  const res = await page.evaluate(
    async (timeout, semantic, legacy, style, pre, initial) => {
      let keepEvolving = true;
      let evolve = await geneticCSS.geneticCSS({
        semantic,
        legacy,
        style,
        pre,
        initial
      });
      setTimeout(() => (keepEvolving = false), timeout);
      let res;
      while (keepEvolving) {
        res = await evolve();
      }
      return res;
    },
    timeout,
    semantic,
    legacy,
    style,
    pre,
    initial
  );

  //  await page.title();
  console.log(res);
  await page.close();
  return res;
};
