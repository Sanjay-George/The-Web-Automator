const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, 
    awaitNavigation, handlePageUnload } = require('../../common/navigationHandler');
const pageHelper = require('../../common/pageHelper');
const { elementTypes, actionTypes, configTypes } = require('../../common/enum');


class LogicBuilder 
{
    constructor(action, page, meta, json) {
        this.action = action;
        this.page = page;
        this.meta = meta;

        this.targets = null;
        this.labels = null;
        this.json = json || {};
        this.jsonKeys = [];
        this.isActionKeyPresent = false;
    }

    initOutputJSON = () => {
        const { action } = this;
        this.isActionKeyPresent = action.actionKey.length > 0;
        if(this.isActionKeyPresent) {
            this.json[action.actionKey] = [];
        } 
    };

    populateOutputJSON = (action, innerJson, isActionKeyPresent) => {
        let json = this.json;
        if(isActionKeyPresent){
            json[action.actionKey].push(innerJson);
        }
        else {
            // INFO: 
            // Copying each property of innerJSON into json, coz of recursive call stack. 
            // Deep or shallow copy won't work

            // TODO: TEST THIS. 
            for (const prop in innerJson) { 
                if(Array.isArray(this.json[prop])) {
                    json[prop].push(innerJson[prop]);
                }
                else {
                    json[prop] = innerJson[prop];
                }
            }
        }
        return json;
    };

    getInnerText = async (selector, page) => {
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

    performAction = async (action, target, memory, step, page) => {
        console.log(`\nINFO: performAction() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
        try {
            await this.perform(action, target, page);
        }
        catch(ex) {
            console.error("\nPPTR EXCEPTION:");
            console.error(ex);
            // if perform(action) doesn't work, retry previous actions (to handle popup cases)
            // if none of the actions work, go back one page and try 
            let wasActionPerformed = await this.tryActionsInMemory(memory, step, page);
            if(!wasActionPerformed) {
                wasActionPerformed = await this.tryActionOnPrevPage(action, target, memory, step, page);
                return wasActionPerformed;
            }
        }
        return true;
    };
    
    tryActionsInMemory = async (memory, step, page) => {
        // repeat all actions from beginning of memory to end
        console.log(`\nINFO: tryActionsInMemory() - memory.length: ${memory.length}, step: ${step}`);

        let wasActionPerformed = true;
        for (let i = 0; i <= step; i++) {
            if(memory[i] === null) {
                continue;
            }
            const { action, target } = memory[i];
            try{
                if(action.actionType === this.action.actionType) {
                    await this.perform(action, target, page);
                }
                else {
                    const { getLogicBuilder } = this.meta;
                    const logicBuilder = 
                        getLogicBuilder(action.actionType, action, page, this.meta, this.json);
                    await logicBuilder.perform(action, target, page);
                }
            }
            catch(ex) {
                console.error("\nPPTR EXCEPTION:");
                console.error(ex);
                if(i === step) {
                    wasActionPerformed = false;
                }
                continue;
            }
        }
        return wasActionPerformed;
    };
    
    tryActionOnPrevPage = async (action, target, memory, step, page) => {
        console.log(`\nINFO: tryActionOnPrevPage() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
        
        if(await page.url() === this.meta.rootUrl)  return false;
        await Promise.all([
            addXhrListener(page),
            addNavigationListener(page),
        ]);
        
        const { insertScripts } = this.meta; 
        // todo: make this incremental backoff
        const httpRes = await pageHelper.goBack(page, insertScripts); 
        await Promise.all([
            awaitXhrResponse(),
            awaitNavigation(),
            page.waitForTimeout(500),
        ]);
    
        // console.log("INFO: going back, httpRes", httpRes);
    
        if(httpRes  === null) {
            await pageHelper.reloadPage(page, insertScripts);
            // return await this.performAction(action, target, memory, step, page);
        }
    
        await Promise.all([
            removeXhrListener(),
            removeNavigationListener(), 
        ]);
    
    
        // await page.goBack(pageHelper.getWaitOptions());
        // await page.reload(pageHelper.getWaitOptions());
        return await this.performAction(action, target, memory, step, page);
    };    
}


module.exports = {
    LogicBuilder,
}
