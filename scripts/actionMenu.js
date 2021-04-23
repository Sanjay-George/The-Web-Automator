class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu"; 
        this.currentElementType = null;
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
                <div class="input-field col5">
                    <label for="action-name">Action</label>
                    <input id="action-name" type="text">
                </div>

                <div class="input-field col4">
                    <label for="action-key">Key</label>
                    <input id="action-key" type="text">
                </div>

                <div class="input-field col3">
                    <select id="action-type">
                        <option value="" disabled selected>Action Type</option>
                        <option value="1">Click</option>
                        <option value="2">Type in</option>
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

    removeFormEventListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);
    };

    hideMenu = () => {
        this.overlay.classList.add("hide");
        this.menu.classList.add("hide");
    }

    close = (event) => {
        this.hideMenu();
        this.removeFormEventListeners();  // TODO: CHECK IF WORKING
        Profiler.disableConfigurationMode();

        // TODO: also remove all highlights on all actions and labels
    };

    actionTargetHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, this.currentElementType);
        },
    
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
    
        handleOneTimeMouseClick: (e) => {
            e.preventDefault();
            this.showMenu();
            DynamicEventHandler.removeHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.removeHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.removeHandler("click", this.actionTargetHandlers.handleOneTimeMouseClick);
        }
    };

    setFormEventListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // set parent as target

        // select individual element
        document.querySelector(`#${this.containerId} #target-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual target input clicked");

            this.hideMenu();
            this.currentElementType = Profiler.elementTypes.ACTION_TARGET;

            DynamicEventHandler.addHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionTargetHandlers.handleOneTimeMouseClick);
        });

        // select individual label

        // select all similar siblings

    };

    showMenu = () => {
        this.menu.classList.remove("hide");
        this.overlay.classList.remove("hide");
    }

    open = (event) => {     
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);

        this.showMenu();
    
        this.menu.innerHTML = this.getMenuHTML(event);
        this.setFormEventListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}