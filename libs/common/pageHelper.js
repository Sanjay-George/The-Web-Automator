
const DEFAULT_TIMEOUT = 10000;
const MAX_ATTEMPTS = 3;

function getWaitOptions(customTimeout) {
	return { waitUntil: 'load', timeout: customTimeout || DEFAULT_TIMEOUT };
} 

async function openTab(browser, url, callback = null, attempt = 0, timeout = 0) {
    console.log(`\nOpening URL : ${url}`);
    let page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setUserAgent(getUserAgent());
    // getConfigValue("performanceMode") &&  
	// await disableHeavyResources(page);
	try {
		await page.goto(url, getWaitOptions(attempt * DEFAULT_TIMEOUT));
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nPPTR EXCEPTION:");
		console.error(ex);
		if(ex.name === "TimeoutError" && attempt < MAX_ATTEMPTS) {
			await closeTab(page);
			return await openTab(browser, url, callback, attempt+1);
		}
		return null;
	}
    // await warmUpPage(page);
    return page;
}

async function reloadPage(page, callback = null, attempt = 0)
{
	try {
		await page.reload(getWaitOptions(attempt * DEFAULT_TIMEOUT));
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nPPTR EXCEPTION:");
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
		httpRes = await page.goBack(getWaitOptions(attempt * DEFAULT_TIMEOUT));
		callback && await callback(page);
	}
	catch(ex) {
		console.error("\nPPTR EXCEPTION:");
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

function getUserAgent() {
	const userAgents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36 Edg/87.0.664.75", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15"];
	return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function closeTab(page) {
    if(page === undefined) return;  
    return page.close();
}

async function takeScreenShot(elementHandle, fileName) {
	await elementHandle.click();
	await elementHandle.screenshot({path: `./screenshots/${fileName}.png`});
}

async function disableHeavyResources(page) {
	// const heavyResources = ["image", "media", "font"]; 
	const heavyResources = ["image"]; 
	const blockedReqKeywords = ["video", "playback", "youtube", "autoplay"];

	await page.setRequestInterception(true);
	page.on('request', async request => {
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
		console.error("\nPPTR EXCEPTION:");
		console.error(ex);
	}
	});
}



module.exports = {
    openTab,
    closeTab,
    takeScreenShot,
    disableHeavyResources,
	getWaitOptions,
	goBack,
	reloadPage,
}