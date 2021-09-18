const pageHelper = require('../common/pageHelper');
const { elementTypes, actionTypes } = require('../common/enum');

async function run(configuration) {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null} );
    let page = await pageHelper.openTab(browser, "https://www.carwale.com/");

    await recursiveRun(configuration, 0, page);
}


// TODO: RETHINK HOW TO PERFORM ACTIONS
async function recursiveRun(configChain, step, page, goBack = false) {
    currentStep = configChain[step];

    if(currentStep.elementType === elementTypes.ACTION) {  
        const { selectors, actOnSimilarTargets, maxActionCount } = currentStep.actionTargetsMeta;

        // populate actionable targets (selector) first based on actOnSimilarTargets flag

        selectors.forEach(selector => {
            // perform the action based on actionType
            // if page navigates, set goBackOnceDone
            // formulate final jSON

            act(selector, currentStep.actionType);

            
            await recursiveRun(controlChain, step+1, page, goBack); 
            
            if(goBack) { // TODO: RETHINK
                // go back in puppeteer
            }
        });
    }
    else if(currentStep.elementType === elementTypes.STATE) {}
    
}



const act = async (selector, actionType) => {
    switch(actionType) {
        case actionTypes.CLICK:
            await Promise.all([
                page.waitForNavigation(waitOptions),
                page.click(selector),
            ]);
            break;
        default:
            break;
    }
};



module.exports = {
    run
};






/*
                        open popup   city        area      submit
configChain = [(a1, t1), (a2, t1),| (a3, t1),| (a4, t1),| (a5, t1))]
                                                   ^ 
                           curr                   pause



RETHINK CONFIG STRUCTURE

run(configChain = [], configMeta= [{}, {}], stepIndex = 0, targetIndex = 0, isBackTracking = false)
{
    const currActionMeta = configMeta[stepIndex];
    let currTarget;

    if(isBackTracking) {
        currTarget =  configChain[stepIndex];
    }
    else {
        // get all targets(selector) of this action, before this step
        targetList = getAllTargets(currActionMeta.actionTargetsMeta.selectors);
        if(targetIndex === targetList.length) {
            return; 
        }
        currTarget = targetList[targetIndex];
    }    
    
    if(performAction(currActionMeta, ) !== work) {
        run(configChain, configMeta, stepIndex-1, targetIndex, true)
    }
    
    
    
    
    
    // PERFORM ACTION HERE....

    

    if(!configChain[stepIndex]) {
        // a3 hasn't happened yet, a1 and a2 are in config chain.
        configChain.push(currTarget);
    }
    else {
        // (a3,t1) has happend, now (a3,t2) needs to be selected
        configChain[stepIndex] = currTarget
    }


    run(configChain, configMeta, stepIndex+1, targetIndex)




    
    // for (let i = 0; i < targetSelectors.length; i++) {
    //     selector = targetSelectors[i];

    //     configChain.push(['', selector])
    // }

}



                           
optimization ??
{
    pausePoint: resumePoint
    a4: a2
    a3: a2
}

*/