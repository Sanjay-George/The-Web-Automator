const { LogicBuilder } = require("./logicBuilder");
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, awaitNavigation } = require('../../common/navigationHandler');
const { click } = require("../../common/pageHelper");
const { ActionDirector } = require("./actionDirector");
class ClickLogicBuilder extends LogicBuilder 
{
    constructor(action, page, meta, json)
    {
        super(action, page, meta, json);
    }

    /**
     * Populate targets, labels and jSON keys for further processing
     */
    populateTargetsLabelsAndJsonKeys = async () => {
        const { targets, labels } = await this.populateAllTargetsAndLabels(this.action, this.page);
        const jsonKeys = await this.getActionJsonKeys(targets, labels, this.page) || [];
        this.targets = targets;
        this.labels = labels;
        this.jsonKeys = jsonKeys;
    };

    /**
     * Iterate through the list of targets and perform action on the page
     */
    iterate = async () => {
        const { run, memorize, chain, step, page, memory } = this.meta;
        const { action, targets, labels, jsonKeys, isActionKeyPresent } = this;

        for(let i = 0; i < targets.length; i++) { // TODO: REVERT Math.min()
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
                continue;
            }
            await run(chain, step + 1, page, innerJson, memory);
    
            console.log(`\nINFO: innerJSON inside action: ${JSON.stringify(innerJson)}`);

            this.json = this.populateOutputJSON(action, innerJson, isActionKeyPresent);
        }
    };

    /**
     * Populate list of targets and labels based on chosen similarity logic
     * @param {object} action 
     * @param {Page} page 
     * @returns {object} of the form { targets: Array<string>, labels: Array<string> }
     */
    populateAllTargetsAndLabels = async (action, page) => {

  
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
    
    /**
     * Similarity Logic to select immediate siblings
     * @param {Array<string>} selectedTargets list of target selectors
     * @param {Page} page 
     * @returns {Array<string>} final list of selectors
     */
    populateSiblings = async (selectedTargets, page) => {
        if(selectedTargets.length === 0)   return [];
    
        const finalTargets =  await page.evaluate((selectedTargets) => { 
            const targets = DomUtils.findSimilarElementsByTreePath(selectedTargets); // todo: check this, seems wrong
            const targetSelectors = [];
            targets.forEach(target => {
                targetSelectors.push(DomUtils.getQuerySelector(target));
            });
            return targetSelectors;
        }, selectedTargets);
        
        return finalTargets;  // target selectors, not elements
    };
    
    /**
     * Similarity logic to select similar elements by using the tree path of current element
     *  @param {Array<string>} selectedTargets list of target selectors
     *  @param {Page} page 
     *  @returns {Array<string>} final list of selectors
     */
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

        if(!finalTargets.length) {
            console.error("populateSimilarTargets() - Couldn't find any targets matching the selector");
        }
        
        // console.log('INFO: All targets', JSON.stringify(finalTargets));
    
        return finalTargets;  // target selectors, not elements
    };

    /**
     * Get JSON keys for all targets of the current action. 
     * JSON keys are extracted from the innerText property of labels (or targets)
     * @param {Array<string>} targets 
     * @param {Array<string>} labels 
     * @param {Page} page 
     * @returns {Array<string>}
     */
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

    /**
     * @param {object} action object containing action data  
     * @param {string} target selector
     * @param {object} page puppeteer page
    */
    perform = async (action, target, page, byPassChecks = false) => {
        try{
            const { insertScripts } = this.meta;

            // await addXhrListener(page);
            // await addNavigationListener(page);
            
            // TODO: figure out how to waitForNavigation() this ONLY if page is about to redirect
            await page.evaluate(selector => {
                DomUtils.sanitizeAnchorTags(selector)
            }, target);

            const wasActionPerformed = await click(target, page, byPassChecks);
            await page.waitForLoadState('networkidle');

            // await Promise.all([
            //     awaitXhrResponse(),
            //     awaitNavigation(),
            //     page.waitForTimeout(1000),
            // ]);
            
            // TODO: ADD THIS BACK LATER, IN CASE DomUtils not defined error still comes
            await insertScripts(page);
                
            // await removeXhrListener();
            // removeNavigationListener(); 
            return wasActionPerformed;
        }
        catch(ex) 
        {
            return false;
        }
    };
}

module.exports = {
    ClickLogicBuilder,
}
