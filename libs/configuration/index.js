// const puppeteer = require('puppeteer');
const { chromium, firefox, webkit } = require('playwright');

const pageHelper = require('../common/pageHelper');
const crawlersDL = require("../database/crawlersDL");
const { crawlerStatus } = require('../common/enum');

let configChain = [];

const configure = async (crawler) => {
	const browser = await firefox.launch({ headless: false, defaultViewport: null} );
	try {
		let page = await pageHelper.openTab(browser, crawler.url, handlePageLoad);
		await page.bringToFront();
	
		configChain = [];
	
		if(page === null)	return;
	
		page.on('load', async () => {
			// insert all styles and scripts
			console.log(`DOM loaded: ${page.url()}`);
			await insertStyles(page);
			await insertScripts(page);
			await exposeFunctions(page);
			await sanitizeAnchorTags(page);
		});
	
		page.on('dialog', async dialog => {
			console.log(dialog.message());
			await dialog.dismiss();
		});
	
		page.on('close', async () => {
			console.log("page closed");
	
			if(!configChain.length) 	return;
	
			let crawlerData = {
				...crawler,
				configChain: JSON.stringify(configChain),
				status: crawlerStatus.CONFIGURED,
			}
			await crawlersDL.update(crawler.id, crawlerData);
	
			browser !== null && await browser.close();
		});
	}
	catch(ex) {
		console.error(ex);
		browser !== null && await browser.close();
	}
};

const handlePageLoad = async (page) => {
	// insert all styles and scripts
	// console.log(`DOM loaded: ${page.url()}`);
	await insertStyles(page);
	await insertScripts(page);
	await exposeFunctions(page);
	await sanitizeAnchorTags(page);
}

// exposed functions survives navigation, so no need to expose again on page refresh
// but sometimes functions aren't exposing on first try. 
// temporary fix - expose functions on page reload and catch the error 'method already exists'
const exposeFunctions = async (page) => {
	console.log('exposeFunctions - exposing getConfigChain');
	try {
		await page.exposeFunction('getConfigChain', () => configChain);
	}
	catch(ex) {
		console.error("exposeFunctions - failed exposing getConfigChain");
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
	}
};


const insertStyles = async page => {
	await page.addStyleTag({ url: "https://fonts.googleapis.com/icon?family=Material+Icons"});
	await page.addStyleTag({ path: "./styles/menu.css"});
};

const insertScripts = async page => {
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

const sanitizeAnchorTags = async page => {
	await page.evaluate(() => {
		const anchorTags = 
			Array.from(document.querySelectorAll("a"))
				.filter(item => item.target === "_blank");
		anchorTags.forEach(element => {
			DomUtils.setAnchorTargetTypeToSelf(element);
		});
	});
}

module.exports = {
	configure,
}














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