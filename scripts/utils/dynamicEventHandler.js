// This module ensures that event listeners of the same type are only applied once, and handles them effectively
// On adding a listener (eg: click), existing listener is removed,  maintained in stack, and the new one is applied
// On removing a listener, it is removed from stack, and the penultimate listener is applied back.
// Supports only listeners on document as of now. 

let handlers = {}; // TODO: MOVE INSIDE SCOPE

const DynamicEventHandler = (() => {
    handlers = {
        "mouseover": [],
        "mouseout": [],
        "click": [],
    };

    const addHandler = (eventType, handler) => {
        if(!eventType)  return;
        if(typeof handler !== "function")   return;

        if(handlers[eventType].length > 0) {
            // console.log(handlers[eventType][handlers[eventType].length - 1]);
            document.removeEventListener(eventType, handlers[eventType][handlers[eventType].length - 1]);
        }
        handlers[eventType].push(handler);
        document.addEventListener(eventType, handler);
    };

    const removeHandler = (eventType) =>  {
        if(!eventType)  return;
        if(handlers[eventType].length === 0)        return;

        var lastHandler = handlers[eventType].pop();
        // console.log(lastHandler);
        document.removeEventListener(eventType, lastHandler);
        document.addEventListener(eventType, handlers[eventType][handlers[eventType].length - 1]);
    }; 

    return {
        addHandler,
        removeHandler
    }
})();