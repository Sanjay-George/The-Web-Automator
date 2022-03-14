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
            let wasActionPerformed = await this.perform(action, target, page);
            if(wasActionPerformed) {
                return true;
            }
    
            // INFO: if perform(action) doesn't work, retry previous actions (to handle popup cases)
            // if none of the actions work, go back one page and try 
            wasActionPerformed = await this.tryActionsInMemory(memory, step, page);
            if(!wasActionPerformed) {
                wasActionPerformed = await this.tryActionOnPrevPage(action, target, memory, step, page);
                return wasActionPerformed;
            }
            return true;
        }
        catch(ex) {
            console.error("\nEXCEPTION:");
            console.error(ex);
        }
        return false;
    };
    
    tryActionsInMemory = async (memory, step, page) => {
        // INFO: repeat all actions from beginning of memory to the current step
        console.log(`\nINFO: tryActionsInMemory() - memory.length: ${memory.length}, step: ${step}`);

        let wasActionPerformed = true;
        for (let i = 0; i <= step; i++) {
            if(memory[i] === null) {
                continue;
            }
            const { action, target } = memory[i];
            let wasSuccessful = false;
            
            if(action.actionType === this.action.actionType) {
                wasSuccessful = await this.perform(action, target, page, true);
            }
            else {
                const { getLogicBuilder } = this.meta;
                const logicBuilder = 
                    getLogicBuilder(action.actionType, action, page, this.meta, this.json);
                wasSuccessful = await logicBuilder.perform(action, target, page, true);
            }
            if(!wasSuccessful && i === step) {
                wasActionPerformed = false;
            }
        }    
        return wasActionPerformed;
    };
    
    tryActionOnPrevPage = async (action, target, memory, step, page) => {
        console.log(`\nINFO: tryActionOnPrevPage() - action: ${action.actionName.toUpperCase()}, target: ${target}`);
        
        if(await page.url() === this.meta.rootUrl)  return false;
        
        const { insertScripts } = this.meta; 
        const httpRes = await pageHelper.goBack(page, insertScripts); 
        // httpRes && await page.waitForLoadState('networkidle');
        
        if(httpRes  === null) {
            await pageHelper.reloadPage(page, insertScripts);
            // await page.waitForLoadState('networkidle');
        }

        return await this.performAction(action, target, memory, step, page);
    };    
}


module.exports = {
    LogicBuilder,
}
