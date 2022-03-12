
const playwright = require('playwright');

const PAGE_LOAD_TIMEOUT = 10000;
const ACTIONABILITY_TIMEOUT = 5000;
const MAX_ATTEMPTS = 3;

function getWaitOptions(customTimeout) {
	return { waitUntil: 'load', timeout: customTimeout || PAGE_LOAD_TIMEOUT };
} 

async function openTab(browser, url, callback = null, attempt = 1, timeout = 0) {
	console.log(`\nOpening URL : ${url}`);

	const context = await browser.newContext({
		bypassCSP: true,
		colorScheme: 'light',
		recordVideo: {
			dir: './videos/'
		},
	});
	// context.setDefaultTimeout(5000);
	context.grantPermissions(['geolocation', 'notifications']);
    const page = await context.newPage();

    // await page.setBypassCSP(true);
    // await page.setUserAgent(getUserAgent());
    // getConfigValue("performanceMode") &&  
	// await disableHeavyResources(page);
	
	try {
		await page.goto(url, getWaitOptions(attempt * PAGE_LOAD_TIMEOUT));
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
		if(ex.name === "TimeoutError" && attempt < MAX_ATTEMPTS) {
			await closeTab(page);
			return await openTab(browser, url, callback, attempt+1);
		}
		return null;
	}
    return page;
}

async function reloadPage(page, callback = null, attempt = 0)
{
	try {
		await page.reload(getWaitOptions(attempt * PAGE_LOAD_TIMEOUT));
		await page.waitForLoadState('networkidle');
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
		if(ex.name === "TimeoutError" && attempt < MAX_ATTEMPTS) {
			// await closeTab(page);
			return await reloadPage(page, callback, attempt+1);
		}
	}
}

async function goBack(page, callback = null, attempt = 0)
{
	const currUrl = page.url();
	let httpRes = null;
	try {
		httpRes = await page.goBack(getWaitOptions(attempt * PAGE_LOAD_TIMEOUT));
		await page.waitForLoadState('networkidle');
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
		if(ex.name === "TimeoutError" && attempt < MAX_ATTEMPTS) {
			// await closeTab(page);
			if(page.url() === currUrl) {
				await reloadPage(page, callback);
				return await goBack(page, callback, attempt+1);
			}
			await reloadPage(page, callback);
			return await goBack(page, callback, attempt+1);
		}
	}
	return httpRes;
}


async function closeTab(page) {
    if(page === undefined) return;  
    return page.close();
}


async function click(selector, page, byPassChecks = false) {
	try {
		const locator = page.locator(selector);
		await locator.first().click({
			force: byPassChecks,
			timeout: byPassChecks ? 500 : ACTIONABILITY_TIMEOUT,   // todo: improve this logic. If the page is already loaded, decrease timeout, else keep higher
		});
		return true;
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
		// if(ex instanceof playwright.errors.TimeoutError) {
		// 	return await click(selector, page, byPassChecks);
		// }
	}
	return false;
}



module.exports = {
    openTab,
    closeTab,
    // takeScreenShot,
    // disableHeavyResources,
	getWaitOptions,
	goBack,
	reloadPage,
	click,
}