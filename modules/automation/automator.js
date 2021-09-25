const pageHelper = require('../common/pageHelper');
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const { elementTypes, actionTypes } = require('../common/enum');
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, awaitNavigation, handlePageUnload } = require('../common/navigationHandler');

let rootUrl = "";

const initiate = async (url, configChain) => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
    let page = await pageHelper.openTab(browser, url);
    rootUrl = url;
    
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start(`./captures/screen-rec-${+ new Date()}.mp4`);

    await insertScripts(page);

    page.on('domcontentloaded', async () => {
		console.log(`\nDOM loaded: ${page.url()}`);
		await insertScripts(page);
	});

    await run(configChain, 0, page);

    await recorder.stop();
    await page.close();
};


const run = async (chain, step, page, memory = []) => {
    console.log(`\n\nrun() - step: ${step}, chainLength: ${chain.length}`);
    if(step >= chain.length)     return;

    const action = chain[step];
    const targets = action.selectSimilar ?  await populateSimilarTargets(action.selectedTargets, page) : action.selectedTargets;

    console.log(`Number of targets: ${targets.length}`);
    
    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        memorize(memory, step, action, target);
        
        const isActionPerformed = await performAction(action, target, memory, step, page);
        if(!isActionPerformed) {
            console.error(`Unable to perform action "${action.actionName}" for target at index ${i}`);
            break;
        }
        await run(chain, step + 1, page, memory);
    }
};

const performAction = async (action, target, memory, step, page) => {
    console.log(`performAction() - action: ${action.actionName}, target: ${target}`);
    try {
        await perform(action, target, page);
    }
    catch(ex) {
        // if perform(action) doesn't work, retry previous actions (handle popup cases)
        // if none of the actions work, go back one page and try 
        let wasActionPerformed = await tryActionsInMemory(memory, step, page);
        if(!wasActionPerformed) {
            wasActionPerformed = await tryActionOnPrevPage(action, target, memory, step, page);
            return wasActionPerformed;
        }
    }
    return true;
};

const tryActionsInMemory = async (memory, step, page) => {
    // repeat all actions from beginning of memory to end
    console.log(`\ntryActionsInMemory() - memory.length: ${memory.length}, step: ${step}`);
    // console.log(JSON.stringify(memory));

    let wasActionPerformed = true;
    for (let i = 0; i <= step; i++) {
        const { action, target } = memory[i];
        try{
            // console.log(target);
            await perform(action, target, page);
        }
        catch(ex) {
            if(i === step) {
                wasActionPerformed = false;
            }
            continue;
        }
    }
    return wasActionPerformed;
};

const tryActionOnPrevPage = async (action, target, memory, step, page) => {
    console.log(`\ntryActionOnPrevPage() - action: ${action.actionName}, target: ${target}`);
    
    if(await page.url() === rootUrl)  return false;
    if(await page.goBack(pageHelper.getWaitOptions())  === null) {
        return false;
    }
    return await performAction(action, target, memory, step, page);
};


const memorize = (memory, step, action, target) => {
    if(memory[step]) {
        memory[step] = {action, target}; // tuple
    }
    else {
        memory.push({action, target});
    }
};


const perform = async (action, target, page) => {
    await addXhrListener(page);
    await addNavigationListener(page);
    switch(parseInt(action.actionType)) {
        case actionTypes.CLICK:
            // TODO: figure out how to waitForNavigation() this ONLY if page is about to redirect
            // TODO: test client-side render, react / SPAs -
            // TODO: incorporate xhrHandler

            await page.click(target);
            await Promise.all([
                awaitXhrResponse(),
                awaitNavigation(),
                // page.waitForTimeout(5000),
            ]);
            

            // page.waitForNavigation(pageHelper.getWaitOptions()),   
            break;
        default:
            break;
    }
    await removeXhrListener();
    removeNavigationListener(); 
};

const populateSimilarTargets = async (selectedTargets, page) => {
    if(selectedTargets.length === 0)   return [];

    const finalTargets =  await page.evaluate((selectedTargets) => { 
        const targets = DomUtils.findSimilarElements(selectedTargets);
        const targetSelectors = [];
        targets.forEach(target => {
            targetSelectors.push(DomUtils.getQuerySelector(target));
        });
        return targetSelectors;
    }, selectedTargets);
    
    // console.log('All targets', JSON.stringify(finalTargets));

    return finalTargets;  // target selectors, not elements
};

const insertScripts = async (page) => {
	await page.addScriptTag({ path: "./scripts/enum.js" });
	await page.addScriptTag({ path: "./scripts/utils/domUtils.js" });

    try { 
        await page.exposeFunction('handlePageUnload', handlePageUnload); 
    } catch(ex) {}
};

const takeScreenShot = async (page) => {
    await page.screenshot({
        path: `./shots/screenshot-${+ new Date()}.png`,
        type: 'jpeg',
        quality: 30,
    });
}


module.exports = {
    initiate
}