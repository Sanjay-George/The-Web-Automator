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
                continue;
            }
            await run(chain, step + 1, page, innerJson, memory);
    
            console.log(`\nINFO: innerJSON inside action: ${JSON.stringify(innerJson)}`);

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
        const { insertScripts } = this.meta;

        await addXhrListener(page);
        await addNavigationListener(page);

        await this.clearInputField(target.selector, page);
        await page.type(target.selector, target.input, { delay: 300 });
        await page.waitForNetworkIdle();

        await Promise.all([
            awaitXhrResponse(),
            awaitNavigation(),
            page.waitForTimeout(1000),
        ]);

        await this.pressKeys(target.keyPresses, page);
        await page.waitForNetworkIdle();

        await Promise.all([
            awaitXhrResponse(),
            awaitNavigation(),
            page.waitForTimeout(1000),
        ]);

        await insertScripts(page);
        
        await removeXhrListener();
        removeNavigationListener(); 
    };

    clearInputField = async (selector, page) => {
        const currentInput = await page.evaluate(selector => {
            return document.querySelector(selector) !== null 
                ? document.querySelector(selector).value
                : "";
        }, selector);

        if(!currentInput || !currentInput.length)    return;

        // console.log(`INFO: clearInputField() - currentInput: ${currentInput}`)

        const re = /([^a-zA-Z0-9])/;
        const backSpaceCount = currentInput.split(re).length;

        await page.focus(selector);

        await page.keyboard.down(specialKeys.CTRL);
        for(let i = 0; i < backSpaceCount; i++) {
            await page.keyboard.press(specialKeys.BACKSPACE);
        }
        await page.keyboard.up(specialKeys.CTRL);
    };

    /**
     * Triggers a keypress by keyCode for specified number of times
     */
    pressKeys = async (keyPresses, page) => {
        if(!keyPresses.length)      return;

        for (const keyPress of keyPresses) {
            const { keyCode, count } = keyPress;
            
            for(let i = 0; i < count; i++) {
                await this.pressKey(keyCode, page);
            }
        };
    };

    pressKey = async (keyCode, page) => {
        await page.keyboard.press(keyCode);
    };


    populateAllTargets = () => {
        // TODO: Form output of the form { selector: "", input: "", keyPresses: [] } 
        const { selectedTargets, textInput, keyPresses } = this.action;
        const finalTargets = [];

        const incrementalKeyPresses = keyPresses.filter(item => item.isIncrementalRepeat);  
        const constantKeyPresses = keyPresses.filter(item => !item.isIncrementalRepeat);  
        const allKeyPressesMatrix = this.populateAllKeyPresses(incrementalKeyPresses, constantKeyPresses); 
       

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