class Menu {

    createOverlay = () => {
        if(document.getElementById("profile-overlay")) {
            this.overlay = document.getElementById("profile-overlay");
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "profile-overlay";
        overlay.classList.add("profile-overlay");
        overlay.classList.add("hide");
        document.body.append(overlay);
        this.overlay = overlay;
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
        this.menu = menu;
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

    removeEventListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);
    };

    close = (event) => {
        // const menu = document.querySelector(`#${this.containerId}`);
        const overlay = document.querySelector("#profile-overlay");
        overlay.classList.add("hide");
        this.menu.classList.add("hide");
        
        this.removeEventListeners();
        Profiler.disableConfigurationMode();
    };

    setEventListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // set parent as target

        // select individual element
        document.querySelector(`#${this.containerId} #target-list`).addEventListener("click", () => {
            // hide popup & overlay 
            // reactivate highlight option (diff color)
        });

        // select individual label

        // select all similar siblings

    };

    showMenu = () => {
        // const menu = document.querySelector(`#${this.containerId}`);
        this.menu.classList.remove("hide");
        const overlay = document.querySelector("#profile-overlay");
        overlay.classList.remove("hide");
    }

    open = (event) => {
        console.log(event.target);       
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);

        this.showMenu();
    
        this.menu.innerHTML = this.getMenuHTML(event);
        this.setEventListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}