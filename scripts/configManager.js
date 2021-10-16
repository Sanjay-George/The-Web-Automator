/* global ActionMenu, StateMenu, Highlighter,DynamicEventHandler */


// INFO: This is the start point of each page crawled in config mode
let actionMenu, stateMenu;  // TODO: move this inside scope, kept here for debugging

const ConfigManager = (() => {
    actionMenu = new ActionMenu();
    stateMenu = new StateMenu();

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

    const handleMouseOver = (e) => {
        !isConfigurationActive && Highlighter.highlightElement(e.target, Enum.elementTypes.DEFAULT);
    };

    const handleMouseOut = (e) => {
        !isConfigurationActive && Highlighter.resetHighlight(e.target);
    };

    // TODO: MAKE OBSOLETE AND REMOVE AFTER TESTING
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

    handleRightClick = (e) => {
        console.log(e);
        e.preventDefault();
        ContextMenu.open(e.pageX, e.pageY, e.target);
    }

    const registerEvents = () => {
        actionMenu.initialize();
        stateMenu.initialize();
        ContextMenu.initialize();

        DynamicEventHandler.addHandler("mouseover", handleMouseOver);
        DynamicEventHandler.addHandler("mouseout", handleMouseOut);
        // DynamicEventHandler.addHandler("click", handleClick);

        document.addEventListener('contextmenu', handleRightClick, false);
    }

    return {
        registerEvents: registerEvents,
        enableConfigurationMode: enableConfigurationMode,
        disableConfigurationMode: disableConfigurationMode,
        isConfigurationActive: () => isConfigurationActive,
    }
})();

const ActionChain = (() => {    
    const get = async () => {
        return await window.getActionChain(); 
    };
    const push = async (action) => {
        let actionChain = await get(); 
        actionChain.push(action);
        return await window.setActionChain(actionChain);
    };
    const pop = async () => {
        let actionChain = await get(); 
        actionChain.pop(); 
        return await window.setActionChain(actionChain);
    }
    const removeAt = async (index = -1) => {
        let actionChain = await get(); 
        if(!actionChain.length || index < 0)     
            return undefined;
        actionChain.splice(index, 1);
        return await window.setActionChain(actionChain);
    };  

    return {
        push: push,
        get: get,
        pop: pop,
        removeAt: removeAt
    };
})();

const StateChain = (() => {    
    const get = async () => {
        return await window.getStateChain(); 
    };
    const push = async (action) => {
        let stateChain = await get(); 
        stateChain.push(action);
        return await window.setStateChain(stateChain);
    };
    const pop = async () => {
        let stateChain = await get(); 
        stateChain.pop(); 
        return await window.setStateChain(stateChain);
    }
    const removeAt = async (index = -1) => {
        let stateChain = await get(); 
        if(!stateChain.length || index < 0)     
            return undefined;
            stateChain.splice(index, 1);
        return await window.setStateChain(stateChain);
    };  

    return {
        push: push,
        get: get,
        pop: pop,
        removeAt: removeAt
    };
})();



ConfigManager.registerEvents();
