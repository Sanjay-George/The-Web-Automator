const ContextMenu = (() => {
    const id = "context-menu";
    let isContextMenuActive = false;

    const options = {
        CONFIGURE_ACTION: 1,
        CONFIGURE_STATE: 2,
        CONFIGURE_BACKBTN: 3
    };

    let currentTarget = null

    const open = (clientX, clientY, pageX, pageY, target) => {
        isContextMenuActive && close();
        
        const menu = document.getElementById(id); 
        menu.classList.remove("hide");

        menu.style.top = clientY + menu.offsetHeight < window.innerHeight ?  `${pageY}px` : `${pageY - menu.offsetHeight}px`;
        menu.style.left = clientX + menu.offsetWidth < window.innerWidth ? `${pageX}px`: `${pageX - menu.offsetWidth}px`;

        isContextMenuActive = true;

        // if clicked anywhere outside context-menu, close the menu.
        // open action/state/ menus according to li clicked
        // TODO: if scrolled, close the menu
        DynamicEventHandler.addHandler("click", handleClick);
        currentTarget = target;
    };

    const close = () => {
        const menu = document.getElementById(id);
        menu.classList.add("hide");
        isContextMenuActive = false;
        currentTarget && Highlighter.resetHighlight(currentTarget);
        DynamicEventHandler.removeHandler("click");
    };

    const handleClick = (e) => {
        // console.log(e);
        
        if(ConfigManager.isConfigurationActive && (!e.target.nodeName.toLowerCase() === "input")) {
            e.preventDefault();
            return;
        }

        switch(parseInt(e.target.dataset.option)) {
            case options.CONFIGURE_ACTION:
                actionMenu.open(currentTarget);
                break;
            case options.CONFIGURE_STATE:
                stateMenu.open(currentTarget);
                break;
            default:
                break;
        }
        close();
    };

    const renderMenu = () => {
        return `
            <ul>
                <li data-option='${options.CONFIGURE_ACTION}'>Configure Action</li>
                <li data-option='${options.CONFIGURE_STATE}'>Configure State</li>
                <li data-option='${options.CONFIGURE_BACKBTN}'>Customize Back Button</li>
            </ul>
        `;
    };

    const initialize = () => {
        createMenuElement(id);
    };

    const createMenuElement = (id) => {
        if(document.getElementById(id))
            return;

        const menu = document.createElement("div");
        menu.classList.add("context-menu");
        menu.classList.add("card");
        menu.innerHTML = renderMenu();
        menu.classList.add("hide");
        menu.id = id;
        document.body.append(menu);
    };

    return {
        open: open,
        initialize: initialize,
        isContextMenuActive: () => isContextMenuActive,
    };

})();