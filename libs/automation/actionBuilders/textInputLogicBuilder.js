const { LogicBuilder } = require("./logicBuilder");
const { addXhrListener, removeXhrListener, awaitXhrResponse } = require('../../common/xhrHandler');
const { removeNavigationListener, addNavigationListener, awaitNavigation } = require('../../common/navigationHandler');
const { specialKeys } = require("../../common/enum");
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
        // TODO: While populating targets, form final targets itself. ie. form {selector, input, keypress} combination here itself. 
        //          Form separate targets for each input text in array
        //          If normal keypress, add in config of existing target
        //          Incase of incremental keypresses, form separate targets with same selector and inputText 

        // INFO: reference of textInput and keyPresses
        //          textInput: [],
        //          keyPresses: [],   // [{code: "Enter", count: 5, isIncrementalRepeat: false}, ...]


        this.targets = this.populateAllTargets();
        // TODO: following are empty for now, 
        //   but should be the final text typed or selected (after hitting keys);
        this.labels = []; 
        this.jsonKeys = [];
    };


    /**
     * Iterate through the list of targets and perform action on the page
     */
    iterate = async () => {
        const { run, memorize, chain, step, page, memory } = this.meta;
        const { action, targets, labels, jsonKeys, isActionKeyPresent } = this;
        const { textInput, keyPresses } = action;

        for(let i = 0; i < targets.length; i++) {
            // iterate through targets 
            const target = targets[i];
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


    /**
     * Types in the text input on the page and presses related keys, as per the config 
     * @param {object} action object containing action data  
     * @param {object} target object of the form { selector: "", input: "", keyPresses: [] }
     * @param {object} page puppeteer page
     */
    perform = async (action, target, page) => {
        await addXhrListener(page);
        await addNavigationListener(page);
       
        await page.evaluate(selector => {
            DomUtils.sanitizeAnchorTags(selector)
        }, target.selector);

        await page.type(target.selector, target.input, { delay: 100 });
        await Promise.all([
            awaitXhrResponse(),
            awaitNavigation(),
            page.waitForTimeout(1000),
        ]);

        await pressKeys(target.keyPresses, page);
        await Promise.all([
            awaitXhrResponse(),
            awaitNavigation(),
            page.waitForTimeout(1000),
        ]);
           
        await removeXhrListener();
        removeNavigationListener(); 
    };

    /**
     * Triggers a keypress by keyCode for specified number of times
     */
    pressKeys = async (keyPresses, page) => {
        if(!keyPresses.length)      return;

        for (const keyPress of keyPresses) {
            const { keyCode, count } = keyPress;
            
            for(let i = 0; i < count; i++) {
                await pressKey(keyCode, page);
            }
        };
    };

    pressKey = async (key, page) => {
        const keyCode = specialKeys[key];
        await page.keyboard.press(keyCode);
    };


    populateAllTargets = () => {
        // TODO: Form output of the form { selector: "", input: "", keyPresses: [] } 
        const { selectedTargets, textInput, keyPresses } = this.action;
        const finalTargets = [];

        const incrementalKeyPresses = keyPresses.filter(item => item.isIncrementalRepeat);  
        const constantKeyPresses = keyPresses.filter(item => !item.isIncrementalRepeat);  
        let allKeyPressesMatrix = this.populateAllKeyPresses(incrementalKeyPresses, constantKeyPresses); 
       

        selectedTargets.forEach(target => {
            textInput.forEach(input => {
                allKeyPressesMatrix.forEach(keyPresses => {
                    finalTargets.push({
                        selector: target,
                        input: input,
                        keyPresses: keyPresses,
                    });
                });

            });
        })

        return finalTargets;
    };

    
    populateAllKeyPresses = (incrementalKeyPresses, constantKeyPresses) => {    
        if(!incrementalKeyPresses.length)          return [ constantKeyPresses ];

        const allKeyPressesMatrix = [];
        let totalArraySize = incrementalKeyPresses.reduce((prev, curr) => { return prev * curr.count; }, 1);

        for(let i = 0; i < totalArraySize; i++)
        {
            allKeyPressesMatrix[i] = [];
            incrementalKeyPresses.forEach(item => {
                allKeyPressesMatrix[i].push({
                    ...item,
                    count: (i % item.count) + 1,
                })
            });
        }

        return allKeyPressesMatrix.map(item => item.concat(constantKeyPresses));
    }

}

// selector1
// ["abc", "def"]
// [Up Arrow * 5, Right Arrow * 2,  Enter * 1]

/*
u1, r1, e1,
u2, r1, e1,
...
u5, r1, e1,

u1, r2, e1, 
...
u5, r2, e1,


u1,
u2
u3


*/


module.exports = {
    TextInputLogicBuilder,
}