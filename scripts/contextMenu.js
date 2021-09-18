const ContextMenu = (() => {
    const name = "context-menu";

    const open = (offsetX, offsetY) => {
        const menu = document.getElementById(name);
        menu.innerHTML = renderMenu();

        menu.classList.remove("hide");
        
        menu.style.top = offsetY + menu.offsetHeight < document.body.offsetHeight ?  `${offsetY}px` : `${offsetY - menu.offsetHeight}px`;
        menu.style.left = offsetX + menu.offsetWidth < document.body.offsetWidth ? `${offsetX}px`: `${offsetX - menu.offsetWidth}px`;
    };

    const renderMenu = () => {
        return `
            <ul>
                <li>Configure Action</li>
                <li>Configure State</li>
                <li>Configure Custom Back Button</li>
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
       //  menu.classList.add("hide");
        menu.id = id;
        document.body.append(menu);
    };

    return {
        open: open,
        initialize: initialize,
    };

})();