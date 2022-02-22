const puppeteer = require('puppeteer');
const fs = require('fs');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const pageHelper = require('../common/pageHelper');
const { elementTypes, actionTypes, configTypes } = require('../common/enum');
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, awaitNavigation, handlePageUnload } = require('../common/navigationHandler');

const crawlersDL = require("../database/crawlersDL");
const { crawlerStatus } = require('../common/enum');

const { ActionDirector } = require('./actionBuilders/actionDirector');
const { ClickLogicBuilder } = require('./actionBuilders/clickLogicBuilder');

let rootUrl = "";

// TODO: RENAME THIS METHOD
const init = async (crawler) => {
    let { id, url, configChain } = crawler;
    let json = {};
    configChain = JSON.parse(configChain);

    try {
        const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
        let page = await pageHelper.openTab(browser, url);
        rootUrl = url;
    
        await crawlersDL.updateStatus(id, crawlerStatus.IN_PROGRESS);
        
        const recorder = new PuppeteerScreenRecorder(page);
        await recorder.start(`./captures/screen-rec-${+ new Date()}.mp4`);
    
        await insertScripts(page);
    
        page.on('domcontentloaded', async () => {
            console.log(`\nDOM loaded: ${page.url()}`);
            await insertScripts(page);
        });
    
        await run(configChain, 0, page, json);
    
        // console.log(JSON.stringify(json));
    
        await recorder.stop();
        await saveData(`data-${+ new Date}`, JSON.stringify(json));
        
        await page.close();
    
        await crawlersDL.update(id, {
            status: crawlerStatus.COMPLETED,
            lastRun: new Date(Date.now())
        });

        await browser.close();
        return json;
    }
    catch(ex) {
        console.error(ex);  // TODO: re-evaluate exception logging at this point
        await crawlersDL.update(id, {
            status: crawlerStatus.FAILED,
            lastRun: new Date(Date.now())
        });
    }
    return json;
};


const run = async (chain, step, page, json, memory = []) => {
    console.log(`\n\nrun() - step: ${step}, chainLength: ${chain.length}`);
    if(step >= chain.length)     return;

    if(chain[step].configType === configTypes.ACTION) {
        const action = chain[step];
        const meta = { run, memorize, chain, step, page, memory, rootUrl };
        
        // TODO: USE FACTORY TO DECIDE WHICH LOGIC BUILDER TO CREATE
        const clickLogic = new ClickLogicBuilder(action, page, meta, json);
        const actionDirector = new ActionDirector();
        await actionDirector.perform(clickLogic);

    }
    else if (chain[step].configType === configTypes.STATE) {
        const state = chain[step];
        json[state.collectionKey] = [];

        let maxElemCount = 0;
        let maxElemPropertyIndex = 0; 
        const propertiesArr = [];

        for (let i = 0; i < state.properties.length; i++) {
            const property = state.properties[i];
            let { keys, values } = await populateAllKeysAndValues(property, page);

            // if the number of selectors for keys and values aren't exactly same,
            // set the key to that of current iterator. 
            // Coz there should be only one key for each value / group of values.
            if(keys.length !== values.length) {
                keys = [keys[i]];
            }

            propertyObj = {
                ...property,
                keys,
                values,
            };
            propertiesArr.push(propertyObj);    

            if(values.length > maxElemCount) {
                maxElemPropertyIndex = i;
                maxElemCount = values.length;
            }
        }

        const refProperty = propertiesArr[maxElemPropertyIndex];
        for (let i = 0; i < refProperty.values.length; i++) {  // ROW-WISE
            const innerJson = {};

            for (let j = 0; j < propertiesArr.length; j++) {   // COLUMN-WISE
                let key = propertiesArr[j].keys[i] || propertiesArr[j].keys[0] || propertiesArr[j].key;
                let value = propertiesArr[j].values[i];

                const labelText = await getInnerText(key, page) || key;
                const targetText = await getInnerText(value, page);

                if(!labelText || !targetText) {
                    continue; 
                }  

                innerJson[labelText] = targetText;
            }

            json[state.collectionKey].push(innerJson);
        }

        console.log(`\nJSON inside state: ${JSON.stringify(json)}\n`);

        await run(chain, step + 1, page, json, memory);

    }
   
};

const getActionJsonKeys = async (targets, labels, page) => {
    if(targets.length === 0)    return [];

    const jsonKeys = [];
    for(let i = 0; i < targets.length; i++) {
        const labelText = await getInnerText(labels[i], page);
        const targetText = await getInnerText(targets[i], page);
        jsonKeys.push(labelText || targetText || "");
    }

    return jsonKeys;
};

const populateAllKeysAndValues = async (property, page) => {
    if(property.selectSimilar) {
        const keys = await populateSimilarTargets([ property.key ], page);
        const values = await populateSimilarTargets([ property.value ], page);
        return {keys, values};
    }
    else if(property.selectSiblings) {
        const keys = await populateSiblings([ property.key ], page);
        const values = await populateSiblings([ property.value ], page);
        return {keys, values};
    }
    else {
        return { keys: [ property.key ], values: [ property.value ] };
    }
};

const getInnerText = async (selector, page) => {
    return await page.evaluate(selector => {
        let element = document.querySelector(selector);
        if(element){
            return element.innerText.trim();  // TODO: sanitize further 
        }
        else {
            return null;
        }
    }, selector);
};

const performAction = async (action, target, memory, step, page) => {
    console.log(`performAction() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
    try {
        await perform(action, target, page);
    }
    catch(ex) {
        // if perform(action) doesn't work, retry previous actions (to handle popup cases)
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
        if(memory[i] === null) {
            continue;
        }
        const { action, target } = memory[i];
        try{
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
    console.log(`\ntryActionOnPrevPage() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
    
    if(await page.url() === rootUrl)  return false;
    await Promise.all([
        addXhrListener(page),
        addNavigationListener(page),
    ]);
    
    const httpRes = await page.goBack(pageHelper.getWaitOptions());
    await Promise.all([
        awaitXhrResponse(),
        awaitNavigation(),
        page.waitForTimeout(500),
    ]);

    // console.log("going back, httpRes", httpRes);

    if(httpRes  === null) {
        await page.reload(pageHelper.getWaitOptions());
        return await performAction(action, target, memory, step, page);
    }

    await Promise.all([
        removeXhrListener(),
        removeNavigationListener(), 
    ]);


    // await page.goBack(pageHelper.getWaitOptions());
    // await page.reload(pageHelper.getWaitOptions());
    return await performAction(action, target, memory, step, page);
};


const memorize = (memory, step, action, target) => {
    if(memory[step]) {
        memory[step] = {action, target}; // tuple
    }
    else if(step === memory.length){
        memory.push({action, target});
    }
    else{
        // TODO: push null objects into memory in case of state, since memory is only for actions
        const fillArr = new Array(step - memory.length).fill(null);
        memory.concat(fillArr);
        memory.push({action, target});
    }
};


const perform = async (action, target, page) => {
    await addXhrListener(page);
    await addNavigationListener(page);
    switch(action.actionType) {
        case actionTypes.CLICK:
            // TODO: figure out how to waitForNavigation() this ONLY if page is about to redirect
            // TODO: check if element is anchor tag and will open in new tab
            await page.evaluate(selector => {
                DomUtils.sanitizeAnchorTags(selector)
            }, target);
            await page.click(target);
            await Promise.all([
                awaitXhrResponse(),
                awaitNavigation(),
                page.waitForTimeout(1000),
            ]);
            break;
        case actionTypes.TEXT:

        default:
            break;
    }
    await removeXhrListener();
    removeNavigationListener(); 
};

const populateAllTargetsAndLabels = async (action, page) => {
    // TODO: If actionType = text / select box, populate the targets and labels here accordingly
    if(action.selectSimilar) {
        const targets = await populateSimilarTargets(action.selectedTargets, page);
        const labels = await populateSimilarTargets(action.selectedLabels, page);
        return {targets, labels};
    }
    else if(action.selectSiblings) {
        const targets = await populateSiblings(action.selectedTargets, page);
        const labels = await populateSiblings(action.selectedLabels, page);
        return {targets, labels};
    }
    else {
        return { targets: action.selectedTargets, labels: action.selectedLabels };
    }
};

const populateSiblings = async (selectedTargets, page) => {
    if(selectedTargets.length === 0)   return [];

    const finalTargets =  await page.evaluate((selectedTargets) => { 
        const targets = DomUtils.findSimilarElementsByTreePath(selectedTargets);
        const targetSelectors = [];
        targets.forEach(target => {
            targetSelectors.push(DomUtils.getQuerySelector(target));
        });
        return targetSelectors;
    }, selectedTargets);
    
    return finalTargets;  // target selectors, not elements
};

const populateSimilarTargets = async (selectedTargets, page) => {
    if(selectedTargets.length === 0)   return [];

    const finalTargets =  await page.evaluate((selectedTargets) => { 
        const targets = DomUtils.findSimilarElementsByTreePath(selectedTargets);
        if(targets.length === 0) return [];

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

async function saveData(pageName, json) {
    const dir = './data';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
	const fileName = `${dir}/${pageName}.json`;
	await fs.writeFile(fileName, json, (err) => {});
}


module.exports = {
    init,
}