const { LogicBuilder } = require("./logicBuilder");
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, 
    awaitNavigation, handlePageUnload } = require('../../common/navigationHandler');
const pageHelper = require('../../common/pageHelper');
const { elementTypes, actionTypes, configTypes } = require('../../common/enum');

class ClickLogicBuilder extends LogicBuilder 
{
    constructor(action, page, meta, json)
    {
        super(action, page, meta, json);
    }

    populateTargetsLabelsAndJsonKeys = async () => {
        const { targets, labels } = await this.populateAllTargetsAndLabels(this.action, this.page);
        const jsonKeys = await this.getActionJsonKeys(targets, labels, this.page) || [];
        this.targets = targets;
        this.labels = labels;
        this.jsonKeys = jsonKeys;
    };

    iterate = async () => {
        const { run, memorize, chain, step, page, memory } = this.meta;
        const { action, targets, labels, jsonKeys, isActionKeyPresent } = this;

        for(let i = 0; i < Math.min(targets.length, 3); i++) { // TODO: REVERT Math.min()
            const target = targets[i];
            const label = labels[i];
            memorize(memory, step, action, target);

            let innerJson = {};
            if(isActionKeyPresent && jsonKeys[i].length)
            {
                innerJson["name"] = jsonKeys[i];
            }

            const isActionPerformed = await this.performAction(action, target, memory, step, page);
            if(!isActionPerformed) {
                console.error(`\nERROR: Unable to perform action "${action.actionName}" for target at index ${i}`);
                break;
            }
            await run(chain, step + 1, page, innerJson, memory);
    
            console.log(`\ninnerJSON inside action: ${JSON.stringify(innerJson)}`);

            this.populateOutputJSON(action, innerJson, isActionKeyPresent);
        }
    };


    // LOGIC SPECIFIC TO CLICK ACTION

    populateAllTargetsAndLabels = async (action, page) => {
        // TODO: If actionType = text / select box, populate the targets and labels here accordingly
        if(action.selectSimilar) {
            const targets = await this.populateSimilarTargets(action.selectedTargets, page);
            const labels = await this.populateSimilarTargets(action.selectedLabels, page);
            return {targets, labels};
        }
        else if(action.selectSiblings) {
            const targets = await this.populateSiblings(action.selectedTargets, page);
            const labels = await this.populateSiblings(action.selectedLabels, page);
            return {targets, labels};
        }
        else {
            return { targets: action.selectedTargets, labels: action.selectedLabels };
        }
    };
    
    populateSiblings = async (selectedTargets, page) => {
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
    
    populateSimilarTargets = async (selectedTargets, page) => {
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

    getActionJsonKeys = async (targets, labels, page) => {
        if(targets.length === 0)    return [];
    
        const jsonKeys = [];
        for(let i = 0; i < targets.length; i++) {
            const labelText = await this.getInnerText(labels[i], page);
            const targetText = await this.getInnerText(targets[i], page);
            jsonKeys.push(labelText || targetText || "");
        }
    
        return jsonKeys;
    };

    perform = async (action, target, page) => {
        await addXhrListener(page);
        await addNavigationListener(page);
       
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
           
        await removeXhrListener();
        removeNavigationListener(); 
    };

}


module.exports = {
    ClickLogicBuilder,
}
