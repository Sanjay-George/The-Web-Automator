const Enum = (() => {
    const configTypes = {
        ACTION: 1,
        STATE: 2
    }; 
    
    const elementTypes = {
        DEFAULT: 0,
        ACTION: 1,
        ACTION_TARGET: 2,
        ACTION_LABEL: 3,
        STATE: 4,
        STATE_TARGET: 5,
        STATE_LABEL: 6
    };
    
    const actionTypes = {
        CLICK: 1,
        TEXT: 2,
        SELECT: 3,
    };

    const stateTypes = {
        SCRAPE_DATA: 1,
        MONITOR_DATA: 2,
    };

    const specialKeys = {
        DOWN_ARROW: 'ArrowDown',
        ENTER: 'Enter'
    };

    return {
        elementTypes,
        actionTypes,
        stateTypes,
        configTypes,
        specialKeys,
    }
})();


