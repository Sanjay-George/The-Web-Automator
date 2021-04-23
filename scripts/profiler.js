var Profiler = (() => {
    const elementTypes = {
        DEFAULT: 0,
        ACTION: 1,
        STATE: 2,
    };


    const actionList = [];
    const stateList = [];

    let isConfigurationActive = false;
    let configuredElement = null;

    const enableConfigurationMode = (element, elementType) => {
        isConfigurationActive = true;
        configuredElement = element;
        
        Utils.resetHighlight(element); 
        Utils.highlightElement(element, elementType);
    };

    const disableConfigurationMode = () => {
        Utils.resetHighlight(configuredElement);
        isConfigurationActive = false;
        configuredElement = null;
    };

    const saveConfiguration = () =>  {};


    const registerEvents = () => {

        const actionMenu = new ActionMenu();
        actionMenu.initialize();

        document.addEventListener("mouseover", (e) => {
            !isConfigurationActive && Utils.highlightElement(e.target, elementTypes.DEFAULT);
        });

        document.addEventListener("mouseout", (e) => {
            !isConfigurationActive && Utils.resetHighlight(e.target);
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
