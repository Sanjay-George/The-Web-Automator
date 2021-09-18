
async function openTab(browser, url) {
    console.log(`\nOpening URL : ${url}`);
    let page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setUserAgent(getUserAgent());
    // getConfigValue("performanceMode") && 
	await disableHeavyResources(page);
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
	// const heavyResources = ["image", "media", "font"]; 
	const heavyResources = ["image"]; 
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



module.exports = {
    openTab,
    closeTab,
    takeScreenShot,
    disableHeavyResources,
}