const pageHelper = require('../common/pageHelper');
const puppeteer = require('puppeteer');
const { elementTypes, actionTypes } = require('../common/enum');

const initiate = async (url, configChain) => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
    let page = await pageHelper.openTab(browser, url);
    await insertScripts(page);

    page.on('domcontentloaded', async () => {
		console.log(`DOM loaded: ${page.url()}`);
		await insertScripts(page);
	});

    await run(configChain, 0, page);
};


const run = async (chain, step, page, memory = []) => {
    if(step > chain.length - 1)     return;

    const action = chain[step];
    const targets = action.selectSimilar ?  await populateSimilarTargets(action.selectedTargets, page) : action.selectedTargets;
    
    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        memorize(memory, step, action, target);
        
        const isActionPerformed = await performAction(action, target, memory, step, page);
        if(!isActionPerformed) {
            console.error(`Unable to perform action : ${action.actionName} for target at index: ${i}`);
            break;
        }
        
        await run(chain, step + 1, page);
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
    console.log(`tryActionsInMemory() - memory: ${JSON.stringify(memory)}, step: ${step}`);

    let wasActionPerformed = true;
    for (let i = 0; i <= step; i++) {
        const { action, target } = memory[step];
        try{
            await perform(action, target, page);
            performedActionCount++;
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
    console.log(`tryActionOnPrevPage() - action: ${action.actionName}, target: ${target}`);
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
    console.log(`Performing action: ${action.actionName}`);

    switch(parseInt(action.actionType)) {
        case actionTypes.CLICK:
            // TODO: figure out how to waitForNavigation() this ONLY if page is about to redirect
            // TODO: test client-side render, react / SPAs -
            // TODO: incorporate xhrHandler
            await page.click(target);
            await page.waitForTimeout(5000);
            // page.waitForNavigation(pageHelper.getWaitOptions()),   
            break;
        default:
            break;
    }
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
    
    console.log('All targets', JSON.stringify(finalTargets));

    return finalTargets;  // target selectors, not elements
};

const insertScripts = async (page) => {
	await page.addScriptTag({ path: "./scripts/enum.js" });
	await page.addScriptTag({ path: "./scripts/utils/domUtils.js" });
};



module.exports = {
    initiate
}