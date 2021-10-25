const puppeteer = require('puppeteer');
const pageHelper = require('./modules/common/pageHelper');
let configChain = [];
const automator = require('./modules/automation/automator');

const url = "https://www.carwale.com/";

(async () => {
	const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
    let page = await pageHelper.openTab(browser, url);

	await insertStyles(page);
	await insertScripts(page);
	await exposeFunctions(page);

	page.on('domcontentloaded', async () => {
		// insert all styles and scripts
		console.log(`DOM loaded: ${page.url()}`);
		await insertStyles(page);
		await insertScripts(page);
		await exposeFunctions(page);

	});

	page.on('dialog', async dialog => {
		console.log(dialog.message());
		await dialog.dismiss();
	});

	page.on('close', async () => {
		// get all data from browser (ConfigManager module) and store in file
		console.log("page closed");

		if(!configChain.length) 	return;

		await page.waitForTimeout(2000);
		await automator.initiate(url, configChain);
	});

// 	configChain = [{"configType":1,"actionName":"click just launched","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["div#root > div:nth-child(4) > div:nth-child(2) > section > div > div > div:nth-child(1) > div > ul > li:nth-child(2) > div > span"],"selectSimilar":false,"selectSiblings":false},{"configType":1,"actionName":"view all just launched","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["div#root > div:nth-child(4) > div:nth-child(2) > section > div > div > div.o-brXWGL > div.o-dJmcbh > div > div > div.o-fznJzb.o-cVfYDK.o-fznJEv.o-chNNuk.o-fznJFh.o-cPFhqO > a > div"],"selectSimilar":false,"selectSiblings":false},{"configType":2,"stateName":"Scrape Model prices","stateType":"1","stateKey":"modelPrices","selectedLabels":["div#root > div.o-bWHzMb.o-ducbvd.o-cglRxs._1paG1N.o-fpkJwH.o-dCyDMp > div._39XvcL._1VfD2h > div.o-dpDliG.o-eAyrtt.o-cglRxs._3xYDcP.o-fpkJwH.o-dCyDMp > section.o-fzoHBq.o-fzptYr.o-brXWGL.o-fznJzb > div > ul > li:nth-child(2) > div > div > div > a > h3"],"selectedTargets":["div#root > div.o-bWHzMb.o-ducbvd.o-cglRxs._1paG1N.o-fpkJwH.o-dCyDMp > div._39XvcL._1VfD2h > div.o-dpDliG.o-eAyrtt.o-cglRxs._3xYDcP.o-fpkJwH.o-dCyDMp >section.o-fzoHBq.o-fzptYr.o-brXWGL.o-fznJzb > div > ul > li:nth-child(3) > div > div > div > div > span.o-Hyyko.o-cyHybq.o-eZTujG.o-eqqVmt"],"selectSimilar":true,"selectSiblings":false,"performAfter":"1"}]
// ;
	
// 	await automator.initiate(url, configChain);
		
})();

// exposed functions survives navigation, so no need to expose again on page refresh
// but sometimes functions aren't exposing on first try. 
// temporary fix - expose functions on page reload and catch the error 'method already exists'
const exposeFunctions = async (page) => {
	console.log('\nexposeFunctions - exposing getConfigChain');
	try {
		await page.exposeFunction('getConfigChain', () => configChain);
	}
	catch(ex) {
		console.error("exposeFunctions - failed exposing getConfigChain");
		// console.trace();
	}

	console.log('exposeFunctions - exposing setConfigChain');
	try {
		await page.exposeFunction('setConfigChain', chain => {
			console.log(JSON.stringify(chain));
			configChain = chain ;
		});
	}
	catch(ex) {
		console.error("exposeFunctions - failed exposing setConfigChain.");
		// console.trace();
	}
};

const insertStyles = async (page) => {
	await page.addStyleTag({ url: "https://fonts.googleapis.com/icon?family=Material+Icons"});
	await page.addStyleTag({ path: "./styles/menu.css"});
};

const insertScripts = async (page) => {
	await page.addScriptTag({ path: "./scripts/menu/menu.js" });
	await page.addScriptTag({ path: "./scripts/enum.js" });
	await page.addScriptTag({ path: "./scripts/menu/actionMenu.js" });
	await page.addScriptTag({ path: "./scripts/menu/stateMenu.js" });
	await page.addScriptTag({ path: "./scripts/utils/domUtils.js" });
	await page.addScriptTag({ path: "./scripts/utils/dynamicEventHandler.js" });
	await page.addScriptTag({ path: "./scripts/utils/highlighter.js" });
	await page.addScriptTag({ path: "./scripts/menu/contextMenu.js" });
	await page.addScriptTag({ path: "./scripts/configManager.js" });
};



/* METHODS TO USE 

browser / page disconnected
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-disconnected
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-close

expose function : node function that can be called from browser
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-pageexposefunctionname-puppeteerfunction

wait for function : browser function that can be awaited from node
https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-pagewaitforfunctionpagefunction-options-args




*/
