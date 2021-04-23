class Menu {

    createOverlay = () => {
        if(document.getElementById("profile-overlay"))
            return;

        const overlay = document.createElement("div");
        overlay.id = "profile-overlay";
        overlay.classList.add("profile-overlay");
        overlay.classList.add("hide");
        document.body.append(overlay);
    };

    createMenuElement = (id) => {
        if(document.getElementById(id))
            return;

        const menu = document.createElement("div");
        menu.classList.add("profile-menu");
        menu.classList.add("card");
        menu.classList.add("hide");
        menu.id = id;
        document.body.append(menu); 
    };

}


class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu"; 
    }

    getMenuHTML = (event) => {
        return `
            <div class="row">
                <div class="col12">
                    <h4>Configure Action</h4>
                </div>
                <i class="small material-icons profile-close">close</i>
            </div>

            <form id='configure-action' class="row">
                <div class="input-field col8">
                    <label for="action-name">Action Name</label>
                    <input id="action-name" type="text" class="validate">
                </div>

                <div class="input-field col4">
                    <select id="action-type">
                        <option value="" disabled selected>Action Type</option>
                        <option value="1">Click</option>
                        <option value="2">Type</option>
                        <option value="3">Select</option>
                    </select>
                </div>
                
                <div class="input-field col8">
                    <label for="parent-container">Parent Container</label>
                    <input id="parent-container" type="text" readonly value="${Utils.getElementPathSelectors(event, 3)}">
                </div>
                <div class="input-field col4">
                    <label>
                        <input type="checkbox" />
                        <span>Set parent container as target</span>
                    </label>
                </div>

                <div class="col8">
                    <div class="input-field">
                        <label for="target-list">Individual Target(s)</label>
                        <input id="target-list" type="text" readonly>
                    </div>
                    <div class="input-field">
                        <label for="label-list">Label Target(s)</label>
                        <input id="label-list" type="text" readonly>
                    </div>
                </div>
                <div class="input-field col4" style="display: flex; align-items: center;">
                    <p>
                    <label>
                        <input type="checkbox"/>
                        <span>Select similar elements</span>
                    </label>
                    </p>
                </div>

                <div class="input-field col12">
                    <label for="custom-input">Custom Input (for autocomplete input)</label>
                    <input id="custom-input" type="text" class="validate">
                </div>

                <a class="button">Configure</a>
            </form>
        `;
    };

    close = (event) => {
        const menu = document.querySelector(`#${this.containerId}`);
        const overlay = document.querySelector("#profile-overlay");
        overlay.classList.add("hide");
        menu.classList.add("hide");
        
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);

        Profiler.disableConfigurationMode();
    };

    open = (event) => {
        console.log(event.target);       
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);

        const menu = document.querySelector(`#${this.containerId}`);
        const overlay = document.querySelector("#profile-overlay");
        
        overlay.classList.remove("hide");
        menu.classList.remove("hide");

        menu.innerHTML = this.getMenuHTML(event);
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);
    };

    initialize = () => {
        this.createMenuElement("action-menu");
        this.createOverlay();
    };
}