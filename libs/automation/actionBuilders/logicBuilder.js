const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, 
    awaitNavigation, handlePageUnload } = require('../../common/navigationHandler');
const pageHelper = require('../../common/pageHelper');
const { elementTypes, actionTypes, configTypes } = require('../../common/enum');


class LogicBuilder 
{
    constructor(action, page, meta) {
        this.action = action;
        this.page = page;
        this.meta = meta;

        this.targets = null;
        this.labels = null;
        this.json = {};
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
        if(isActionKeyPresent){
            this.json[action.actionKey].push(innerJson);
        }
        else {
            // INFO: 
            // Copying each property of innerJSON into json, coz of recursive call stack. 
            // Deep or shallow copy won't work

            // TODO: TEST THIS. 
            for (prop in innerJson) { 
                if(Array.isArray(this.json[prop])) {
                    this.json[prop].push(innerJson[prop]);
                }
                else {
                    this.json[prop] = innerJson[prop];
                }
            }
        }
    };

    // COMMON METHODS

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
        console.log(`performAction() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
        try {
            await this.perform(action, target, page);
        }
        catch(ex) {
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
        console.log(`\ntryActionsInMemory() - memory.length: ${memory.length}, step: ${step}`);
        // console.log(JSON.stringify(memory));
    
        let wasActionPerformed = true;
        for (let i = 0; i <= step; i++) {
            if(memory[i] === null) {
                continue;
            }
            const { action, target } = memory[i];
            try{
                await this.perform(action, target, page);
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
    
    tryActionOnPrevPage = async (action, target, memory, step, page) => {
        console.log(`\ntryActionOnPrevPage() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
        
        if(await page.url() === this.meta.rootUrl)  return false;
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
            return await this.performAction(action, target, memory, step, page);
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
