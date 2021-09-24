    
    const addHandler = (eventType, handler, element = document) => {
        if(!eventType)  return;
        if(typeof handler !== "function")   return;

        const elementHandlers = getHandlersByElementAndType(eventType, element);
        if(elementHandlers.length > 0) {
            element.removeEventListener(eventType, elementHandlers[elementHandlers.length - 1]);
        }
        handlers[eventType].push({element: element, handler: handler});
        element.addEventListener(eventType, handler);
    };

    const removeHandler = (eventType, element = document) =>  {
        if(!eventType)  return;
        if(handlers[eventType].length === 0)        return;

        // remove last handler of element and eventType from the handlers object
        const elementHandlers = handlers[eventType].filter(handler => handler.element === element);
        const lastHandler = elementHandlers.pop();
        const indexOfLastHandler = handlers[eventType].lastIndexOf(lastHandler);
        handlers[eventType].splice(indexOfLastHandler, 1);

        document.removeEventListener(eventType, lastHandler);
        document.addEventListener(eventType, elementHandlers[elementHandlers.length - 1]);  // overflow exception ?
    }; 