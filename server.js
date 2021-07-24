const puppeteer = require('puppeteer');
const fs = require('fs');
const EventEmitter = require('events');


(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
    let page = await openTab(browser, "https://www.bikewale.com/");

	await page.addStyleTag({ url: "https://fonts.googleapis.com/icon?family=Material+Icons"});
	await page.addStyleTag({ path: "./styles/menu.css"});


	await page.addScriptTag({ path: "./scripts/menu.js" });
	await page.addScriptTag({ path: "./scripts/actionMenu.js" });
	await page.addScriptTag({ path: "./scripts/utils/domUtils.js" });
	await page.addScriptTag({ path: "./scripts/utils/dynamicEventHandler.js" });
	await page.addScriptTag({ path: "./scripts/utils/highlighter.js" });
	await page.addScriptTag({ path: "./scripts/profiler.js" });

	page.on('framenavigated', async () => {
		console.log("page navigation occured");
	});

	page.on('dialog', async dialog => {
		console.log(dialog.message());
		await dialog.dismiss();
	});

	page.on('close', async () => {
		// get all data from browser (Profiler module) and store in file
		console.log("page closed");
	})
		
  
})();




/* METHODS TO USE 

browser / page disconnected
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-disconnected
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-close

expose function 
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-pageexposefunctionname-puppeteerfunction

wait for function
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-pagewaitforfunctionpagefunction-options-args




*/





async function openTab(browser, url) {
    console.log(`\nOpening URL : ${url}`);
    let page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setUserAgent(getUserAgent());
    // getConfigValue("performanceMode") && await disableHeavyResources(page);
    await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});
    // await warmUpPage(page);
    return page;
}

function getUserAgent() {
	const userAgents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36 Edg/87.0.664.75", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15"];
	return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function closeTab(page) {
    if(page === undefined || !getConfigValue("debugMode")) return;  
    return page.close();
}

async function takeScreenShot(elementHandle, fileName) {
	await elementHandle.click();
	await elementHandle.screenshot({path: `./screenshots/${fileName}.png`});
}

async function disableHeavyResources(page) {
	const heavyResources = ["image", "media", "font"]; 
	const blockedReqKeywords = ["video", "playback", "youtube", "autoplay"];

	await page.setRequestInterception(true);
	page.on('request', async (request) => {
	try{
		if (heavyResources.includes(request.resourceType())) { 
		await request.abort();
		return;
		}

		let blockReq = false;
		for(let i = 0; i < blockedReqKeywords.length; i++) {
		if(request.url().includes(blockedReqKeywords[i])) {
			blockReq = true;
			break;
		}
		}
		if(blockReq) {
		await request.abort(); 
		return;
		}

		await request.continue();
	}
	catch(ex) {
		console.error(ex);
	}
	});
}

function setGlobalVariables(crawlerDetails) {
	setGlobal("modelName", crawlerDetails.name);
}


