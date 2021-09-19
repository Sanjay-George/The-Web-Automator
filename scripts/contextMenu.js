const ContextMenu = (() => {
    const name = "context-menu";

    const options = {
        CONFIGURE_ACTION: 1,
        CONFIGURE_STATE: 2,
        CONFIGURE_BACKBTN: 3
    };

    let currentTarget = "";

    const open = (offsetX, offsetY, target) => {
        const menu = document.getElementById(name);
        menu.classList.remove("hide");
        
        menu.style.top = offsetY + menu.offsetHeight < document.body.offsetHeight ?  `${offsetY}px` : `${offsetY - menu.offsetHeight}px`;
        menu.style.left = offsetX + menu.offsetWidth < document.body.offsetWidth ? `${offsetX}px`: `${offsetX - menu.offsetWidth}px`;

        // if clicked anywhere outside context-menu, close the menu.
        // open action/state/ menus according to li clicked
        // if scrolled, close the menu
        DynamicEventHandler.addHandler("click", handleClick);
        currentTarget = target;
    };

    const close = () => {
        const menu = document.getElementById(name);
        menu.classList.add("hide");
        DynamicEventHandler.removeHandler("click");
    };

    const handleClick = (e) => {
        console.log(e);
        
        if(ConfigManager.isConfigurationActive && (!e.target.nodeName.toLowerCase() === "input")) {
            e.preventDefault();
            return;
        }

        switch(parseInt(e.target.dataset.option)) {
            case options.CONFIGURE_ACTION:
                actionMenu.open(currentTarget);
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
        createMenuElement(name);
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
    };

})();