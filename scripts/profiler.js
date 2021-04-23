var Profiler = (() => {
    const elementTypes = {
        DEFAULT: 0,
        ACTION: 1,
        ACTION_TARGET: 2,
        ACTION_LABEL: 3,
        STATE: 4,
        STATE_TARGET: 5,
        STATE_LABEL: 6
    };


    const actionList = [];
    const stateList = [];

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
        isConfigurationActive = false;
        configuredElement = null;
    };

    const saveConfiguration = () =>  {};


    const registerEvents = () => {

        const actionMenu = new ActionMenu();
        actionMenu.initialize();

        document.addEventListener("mouseover", (e) => {
            !isConfigurationActive && Highlighter.highlightElement(e.target, elementTypes.DEFAULT);
        });

        document.addEventListener("mouseout", (e) => {
            !isConfigurationActive && Highlighter.resetHighlight(e.target);
        });

        document.addEventListener("click", (e) => {
            console.log(e);
            
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
                setStateMenu(e.target);
            }
        });
    }

    return {
        elementTypes: elementTypes,
        registerEvents: registerEvents,
        enableConfigurationMode: enableConfigurationMode,
        disableConfigurationMode: disableConfigurationMode
    }
})();



Profiler.registerEvents();
