// This is the start point of each page crawled in config mode
let actionMenu;  // todo: move this inside scope, kept here for debugging

const ConfigManager = (() => {
    actionMenu = new ActionMenu();

    // let configuration = [];

    let isConfigurationActive = false;
    let configuredElement = null;

    const enableConfigurationMode = (element, elementType) => {
        isConfigurationActive = true;
        configuredElement = element;
        Highlighter.resetHighlight(element); 
        Highlighter.highlightElement(element, elementType);
    };

    const disableConfigurationMode = () => {
        Highlighter.resetHighlight(configuredElement);
        Highlighter.resetAllHighlights();
        isConfigurationActive = false;
        configuredElement = null;
    };

    const getConfiguration = async () => await window.getConfiguration();
    const setConfiguration = async (config) => {
        // push to config chain (to handle colors etc)
        const configChain = await getConfiguration();
        configChain.push(config);
        await window.setConfiguration(configChain);
    };

    const handleMouseOver = (e) => {
        !isConfigurationActive && Highlighter.highlightElement(e.target, Enum.elementTypes.DEFAULT);
    };

    const handleMouseOut = (e) => {
        !isConfigurationActive && Highlighter.resetHighlight(e.target);
    };

    const handleClick = (e) => {
        // console.log(e);
        
        if(isConfigurationActive && (!e.target.nodeName.toLowerCase() === "input")) {
            e.preventDefault();
            return;
        }

        if(e.shiftKey) {
            e.preventDefault();
            isConfigurationActive = true;
            configuredElement = e.target;
            actionMenu.open(e);
        }

        if(e.ctrlKey) {
            e.preventDefault();
            isConfigurationActive = true;
            configuredElement = e.target;
            // setStateMenu(e.target);
        }
    };

    const registerEvents = () => {
        actionMenu.initialize();

        DynamicEventHandler.addHandler("mouseover", handleMouseOver);
        DynamicEventHandler.addHandler("mouseout", handleMouseOut);
        DynamicEventHandler.addHandler("click", handleClick);
    }

    return {
        registerEvents: registerEvents,
        enableConfigurationMode: enableConfigurationMode,
        disableConfigurationMode: disableConfigurationMode,
        setConfiguration: setConfiguration,
    }
})();


ConfigManager.registerEvents();


const ActionChain = (() => {
    let actionChain = [];
    
    const push = (action) => {
        // store to node
        return actionChain.push(action);
    };
    
    const get = () => {
        // get from node 
        return actionChain
    };

    const pop = () => {
        return actionChain.pop();
        // store to node
    }
    const removeAt = (index = -1) => {
        if(!actionChain.length || index < 0)     return undefined;
        return actionChain.splice(index, 1);
        // store to node
    };  

    return {
        push: push,
        get: get,
        pop: pop,
        removeAt: removeAt
    };
})();
