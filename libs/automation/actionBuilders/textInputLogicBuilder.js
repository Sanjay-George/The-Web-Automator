const { LogicBuilder } = require("./logicBuilder");
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, awaitNavigation } = require('../../common/navigationHandler');
class TextInputLogicBuilder extends LogicBuilder
{
    constructor(action, page, meta, json)
    {
        super(action, page, meta, json);
    }

    /**
     * Populate Targets and Labels for further processing
     * For text input, there will be only one target selector, but multiple text inputs
     */
    populateTargetsLabelsAndJsonKeys = () => {
        // create array with same target, but different values to fill in (based on textInput array)
        // labels will be same as text input 
    };


    /**
     * Iterate through the list of targets and perform action on the page
     */
    iterate = () => {

    }


    /**
     * Types in the text input on the page and presses related keys, as per the config 
     * @param {object} action object containing action data  
     * @param {object} target object of the form { selector: "", input: "" }
     * @param {object} page puppeteer page
     */
    perform = async (action, target, page) => {
        await addXhrListener(page);
        await addNavigationListener(page);
       
        await page.evaluate(selector => {
            DomUtils.sanitizeAnchorTags(selector)
        }, target);

        // TODO: TYPE IN INPUT (target.input)
        // TODO: PERFORM KEY PRESSES (action.keyPresses)
        await page.type(target.selector, target.input, { delay: 100 });

        // await Promise.all([
        //     awaitXhrResponse(),
        //     awaitNavigation(),
        //     page.waitForTimeout(1000),
        // ]);
           
        await removeXhrListener();
        removeNavigationListener(); 
    };

}

module.exports = {
    TextInputLogicBuilder,
}