const PAGE_LOAD_TIMEOUT = 10000;
const ACTIONABILITY_TIMEOUT = 5000;
const MAX_ATTEMPTS = 3;

function getWaitOptions(customTimeout) {
	return { waitUntil: 'load', timeout: customTimeout || PAGE_LOAD_TIMEOUT };
} 

const userAgents = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
	"Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36",
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
	"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1"
];

const botAgents = [
	"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
	"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36",
	"Googlebot/2.1 (+http://www.google.com/bot.html)"
];

async function openTab(browser, url, callback = null, attempt = 1, timeout = 0) {
	console.log(`\nOpening URL : ${url}`);

	const context = await browser.newContext({
		bypassCSP: true,
		colorScheme: 'light',
		recordVideo: {
			dir: './videos/'
		},
		userAgent: botAgents[Math.floor(Math.random() * botAgents.length)],
	});
	// context.setDefaultTimeout(5000);
	context.grantPermissions(['geolocation', 'notifications']);
    const page = await context.newPage();

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
		else {
			throw ex;
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
		else {
			throw ex;
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
			timeout: byPassChecks ? 500 : ACTIONABILITY_TIMEOUT,   
			// todo: improve the timeout logic. 
			// If the page is already loaded, decrease timeout, else keep higher
		});
		return true;
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
		// if(ex instanceof playwright.errors.TimeoutError) {
		// TODO: calculate the timeout based on current speed of transimission (networkidle - domcontentloaded)
		// 	return await click(selector, page, byPassChecks);
		// }
	}
	return false;
}

async function getInnerText(selector, page)
{
	if(!selector || !selector.length)       return null;
	
	try {
		const isValidQuerySelector = await page.evaluate(selector => {
            return DomUtils.isValidQuerySelector(selector);
        }, selector);

		if(!isValidQuerySelector) {
			return selector;
		}

		const locator = page.locator(selector);
		await locator.waitFor({
			// state: 'attached',
			timeout: ACTIONABILITY_TIMEOUT,
		});
		return (await locator.innerText()).trim();
	}
	catch(ex) {
		console.error("\nEXCEPTION:");
		console.error(ex);
	}
	return null;
}

async function disableHeavyResources(page) {
	const heavyResources = ["media", "font"]; 
	// const heavyResources = ["image"]; 
	const blockedReqKeywords = ["video", "playback", "youtube", "autoplay"];

	// await page.setRequestInterception(true);
	await page.route("**/*", async route => {
		const request = route.request();
		if (heavyResources.includes(request.resourceType())) { 
			await route.abort();
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
			await route.abort(); 
			return;
		}

		await route.continue();
	});

	// page.on('request', async request => {
	// 	try{
	// 		if (heavyResources.includes(request.resourceType())) { 
	// 			await request.abort();
	// 			return;
	// 		}

	// 		let blockReq = false;
	// 		for(let i = 0; i < blockedReqKeywords.length; i++) {
	// 			if(request.url().includes(blockedReqKeywords[i])) {
	// 				blockReq = true;
	// 				break;
	// 			}
	// 		}
	// 		if(blockReq) {
	// 			await request.abort(); 
	// 			return;
	// 		}

	// 		await request.continue();
	// 	}
	// 	catch(ex) {
	// 		console.error(ex);
	// 	}
	// });
}




module.exports = {
    openTab,
    closeTab,
	getWaitOptions,
	goBack,
	reloadPage,
	click,
	getInnerText
}