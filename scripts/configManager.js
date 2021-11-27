/* global ActionMenu, StateMenu, Highlighter, DynamicEventHandler */


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

    const disableAllAnchorTags = () => {
        const anchorElements = Array.from(document.querySelectorAll('a')).filter(item => item.host === window.location.host);
        anchorElements.forEach(anchor => {
            const link = document.createElement('no-link');  
            link.id = anchor.id;
            link.classList = anchor.classList;
            link.attributes = anchor.attributes;
            link.onclick = anchor.onclick;
            link.innerText = anchor.innerText;
            link.innerHTML = anchor.innerHTML;
            link.style = anchor.style;
            link.href = anchor.href;
            anchor.replaceWith(link);
        });
    };

    const enableAllAnchorTags = () => {
        const linkElements = Array.from(document.querySelectorAll('no-link'));
        linkElements.forEach(link => {
            const anchor = document.createElement('a');  
            anchor.id = link.id;
            anchor.classList = link.classList;
            anchor.attributes = link.attributes;
            anchor.onclick = link.onclick;
            anchor.innerText = link.innerText;
            anchor.innerHTML = link.innerHTML;
            anchor.style = link.style;
            anchor.href = link.href;
            link.replaceWith(anchor);
        });
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


    const handleRightClick = (e) => {
        console.log(e);
        e.preventDefault();
        if(isConfigurationActive)       return;
        ContextMenu.open(e.pageX, e.pageY, e.target);
    };

    const registerEvents = () => {
        actionMenu.initialize();
        stateMenu.initialize();
        ContextMenu.initialize();

        DynamicEventHandler.addHandler("mouseover", handleMouseOver);
        DynamicEventHandler.addHandler("mouseout", handleMouseOut);
        // DynamicEventHandler.addHandler("click", handleClick);
        
        document.addEventListener('contextmenu', handleRightClick, false);
    };

    return {
        registerEvents: registerEvents,
        enableConfigurationMode: enableConfigurationMode,
        disableConfigurationMode: disableConfigurationMode,
        enableAllAnchorTags: enableAllAnchorTags,
        disableAllAnchorTags: disableAllAnchorTags,
        isConfigurationActive: () => isConfigurationActive,
    }
})();

const ConfigChain = (() => {    
    const get = async () => {
        return await window.getConfigChain(); 
    };
    const push = async (item) => {
        let chain = await get(); 
        chain.push(item);
        return await window.setConfigChain(chain);
    };
    const pop = async () => {
        let chain = await get(); 
        chain.pop(); 
        return await window.setConfigChain(chain);
    };
    const removeAt = async (index = -1) => {
        let chain = await get(); 
        if(!chain.length || index < 0) {     
            return undefined;
        }
        chain.splice(index, 1);
        return await window.setConfigChain(chain);
    };
    const insertAt = async (item, index = -1) => {
        let chain = await get();
        if(chain.length === 0 || index < 0)   return await push(item);

        chain = chain.slice(0, index).concat(item, chain.slice(index));
        return await window.setConfigChain(chain);
    }; 

    return {
        push,
        get,
        pop,
        removeAt,
        insertAt,
    };
})();

ConfigManager.registerEvents();
