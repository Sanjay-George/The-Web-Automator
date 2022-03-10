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
const { TextInputLogicBuilder } = require('./actionBuilders/textInputLogicBuilder');

let rootUrl = "";

// TODO: RENAME THIS METHOD
const init = async (crawler) => {
    let { id, url, configChain } = crawler;
    let json = {};
    configChain = JSON.parse(configChain);

    try {
        const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
        let page = await pageHelper.openTab(browser, url, insertScripts);
        rootUrl = url;
    
        await crawlersDL.updateStatus(id, crawlerStatus.IN_PROGRESS);
        
        const recorder = new PuppeteerScreenRecorder(page);
        await recorder.start(`./captures/screen-rec-${+ new Date()}.mp4`);
    
        await insertScripts(page);
    
        // page.on('domcontentloaded', async () => {
        //     console.log(`\nDOM loaded: ${page.url()}`);
        //     await insertScripts(page);
        // });
    
        await run(configChain, 0, page, json);
    
        // console.log(JSON.stringify(json));

        console.log("\nINFO: Crawling Completed! Saving Data...");
    
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
    console.log(`\n\nINFO: run() - step: ${step}, chainLength: ${chain.length}`);
    if(step >= chain.length)     return;

    if(chain[step].configType === configTypes.ACTION) {
        const action = chain[step];
        const meta = { run, memorize, getLogicBuilder, insertScripts, chain, step, page, memory, rootUrl };
        
        const logicBuilder = getLogicBuilder(parseInt(action.actionType, 10), action, page, meta, json);
        const actionDirector = new ActionDirector();
        await actionDirector.perform(logicBuilder);

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

        console.log(`\nINFO: JSON inside state: ${JSON.stringify(json)}`);

        await run(chain, step + 1, page, json, memory);

    }
   
};

const getLogicBuilder = (actionType, action, page, meta, json) => {
    switch(actionType) {
        case actionTypes.CLICK:
            return new ClickLogicBuilder(action, page, meta, json);
        case actionTypes.TEXT:
            return new TextInputLogicBuilder(action, page, meta, json);
        default:
            return null;
    }
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
    if(!selector || !selector.length)       return null;
    
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
    
    // console.log('INFO: All targets', JSON.stringify(finalTargets));

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