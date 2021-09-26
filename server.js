const puppeteer = require('puppeteer');
const pageHelper = require('./modules/common/pageHelper');
let actionChain = [];
const automator = require('./modules/automation/automator');
// const stateChain;

const url = "https://www.bikewale.com/";

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
		await page.exposeFunction('setActionChain', chain => {
			console.log(JSON.stringify(chain));
			actionChain = chain ;
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
