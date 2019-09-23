const puppeteer = require('puppeteer');
const genetic = require('fs').readFileSync('./public/genetic.js')
const browserReady = puppeteer.launch();
module.exports = async function evolve({timeout, semantic, legacy, style, pre, initial}) {
    const browser = await browserReady;
    const page = await browser.newPage();
    page.evaluate(`(() => {
        ${genetic};
        window.geneticCSS = geneticCSS;
    })()`);
    const res = await page.evaluate(async (timeout, semantic, legacy, style, pre, initial) => {
        let keepEvolving = true;
        let evolve = await geneticCSS.geneticCSS({semantic, legacy, style, pre, initial});
        setTimeout(() => keepEvolving = false, timeout)
        let res;
        while (keepEvolving) {
            res = await evolve()
        }
        return res;
    },timeout, semantic, legacy, style, pre, initial)
    
    //  await page.title();
    console.log(res)
    await page.close();
    return res;
}