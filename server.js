const puppeteer = require('puppeteer');
const pageHelper = require('./modules/common/pageHelper');
let actionChain = [], stateChain = [];
const automator = require('./modules/automation/automator');

const url = "https://www.bikewale.com";

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

		if(!actionChain.length) 	return;

		await page.waitForTimeout(1000);
		await automator.initiate(url, actionChain);
	});

	// actionChain = [{"actionName":"open model selector","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["div.container > div > div.innerContainer > div.modelsSection.priceRow > div.priceTab"],"selectSimilar":false},{"actionName":"select model ","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["div.container > div > div.innerContainer > div.modelsSection.priceRow.active > div.modelsList.priceModelsList > div:nth-child(1)"],"selectSimilar":true},{"actionName":"open location tab","actionType":"1","actionKey":"","selectedLabels":[], "selectedTargets":["div.container > div > div.innerContainer > div.locationSection.priceRow > div.priceTab"],"selectSimilar":false},{"actionName":"open state selector","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["input#txtState"],"selectSimilar":false},{"actionName":"Select state","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["li#\\31 "],"selectSimilar":false,"selectSiblings":true},{"actionName":"open city selector","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["input#txtCity"],"selectSimilar":false},{"actionName":"select city","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["ul#selectCityul > li:nth-child(1)"],"selectSimilar":true},{"actionName":"submit btn","actionType":"1","actionKey":"","selectedLabels":[],"selectedTargets":["div.container > div > div.innerContainer > div.carPrice.checkPrice.checkPriceBTN > a"],"selectSimilar":false}];
	// await automator.initiate(url, actionChain);
		
})();

// exposed functions survives navigation, so no need to expose again on page refresh
// but sometimes functions aren't exposing on first try. 
// temporary fix - expose functions on page reload and catch the error 'method already exists'
const exposeFunctions = async (page) => {
	try {
		await page.exposeFunction('getActionChain', () => actionChain);
	}
	catch(ex) {}
	try {
		await page.exposeFunction('getStateChain', () => stateChain);
	}
	catch(ex) {}

	try {
		await page.exposeFunction('setActionChain', chain => {
			console.log(JSON.stringify(chain));
			actionChain = chain ;
		});
	}
	catch(ex) {}
	try {
		await page.exposeFunction('setStateChain', chain => {
			console.log(JSON.stringify(chain));
			stateChain = chain ;
		});
	}
	catch(ex) {}
};

const insertStyles = async (page) => {
	await page.addStyleTag({ url: "https://fonts.googleapis.com/icon?family=Material+Icons"});
	await page.addStyleTag({ path: "./styles/menu.css"});
};

const insertScripts = async (page) => {
	await page.addScriptTag({ path: "./scripts/menu.js" });
	await page.addScriptTag({ path: "./scripts/enum.js" });
	await page.addScriptTag({ path: "./scripts/actionMenu.js" });
	await page.addScriptTag({ path: "./scripts/stateMenu.js" });
	await page.addScriptTag({ path: "./scripts/utils/domUtils.js" });
	await page.addScriptTag({ path: "./scripts/utils/dynamicEventHandler.js" });
	await page.addScriptTag({ path: "./scripts/utils/highlighter.js" });
	await page.addScriptTag({ path: "./scripts/contextMenu.js" });
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
