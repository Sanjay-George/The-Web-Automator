class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu";
        this.configuration = {
            parentContainer: null,
            actionName: "",
            actionType: null,
            actionkey: "",
            individualTargetsMeta: [],
            individualTargets: [],
            labelTargetsMeta: [],
            labelTargets: [],
            customInputs: []
        }; 
    }

    getMenuHTML = () => {
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
                    <input id="parent-container" type="text" readonly value="${Utils.getElementPathSelectors(this.configuration.parentContainer.fullPath, 2)}">
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
                    <label id="sel-similar">
                        <input type="checkbox"/>
                        <span>Select similar elements</span>
                    </label>
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
            Highlighter.highlightElement(e.target, Profiler.elementTypes.ACTION_TARGET);
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

            this.configuration.individualTargetsMeta.push({ element: e.target, fullPath: e.path });
            document.querySelector("#target-list").value = Utils.getElementPathSelectors(e.path, 2);

            console.log(this);
        }
    };

    actionLabelHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Profiler.elementTypes.ACTION_LABEL);
        },
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
        handleOneTimeMouseClick: (e) => {
            e.preventDefault();
            this.showMenu();
            DynamicEventHandler.removeHandler("mouseover", this.actionLabelHandlers.handleMouseOver);
            DynamicEventHandler.removeHandler("mouseout", this.actionLabelHandlers.handleMouseOut);
            DynamicEventHandler.removeHandler("click", this.actionLabelHandlers.handleOneTimeMouseClick);

            this.configuration.labelTargetsMeta.push({ element: e.target, fullPath: e.path });
            document.querySelector("#label-list").value = Utils.getElementPathSelectors(e.path, 2);
        }
    };

    verifyIndividualTargets = () => {
        if(this.configuration.individualTargetsMeta.length === 0) 
            return false;

        const individualTargetsPath = Utils.getElementPathSelectors(this.configuration.individualTargetsMeta[0].fullPath);
        const parentContainerPath = Utils.getElementPathSelectors(this.configuration.parentContainer.fullPath);
        return individualTargetsPath.includes(parentContainerPath);
    };

    verifyLabelTargets = () => {
        if(this.configuration.individualTargetsMeta.length === 0) 
            return false;

        const labelTargetsPath = Utils.getElementPathSelectors(this.configuration.labelTargetsMeta[0].fullPath);
        const parentContainerPath = Utils.getElementPathSelectors(this.configuration.parentContainer.fullPath);
        return labelTargetsPath.includes(parentContainerPath);
    };

    populateSimilarIndividualTargets = () => {
        const individualTargetsPath = Utils.getElementPathSelectors(this.configuration.individualTargetsMeta[0].fullPath);

        this.configuration.individualTargets = Array.from(document.querySelectorAll(individualTargetsPath));

        this.configuration.individualTargets.forEach(item => {
            Highlighter.highlightElement(item, Profiler.elementTypes.ACTION_TARGET);
        });
    };

    populateSimilarLabelTargets = () => {
        const labelTargetsPath = Utils.getElementPathSelectors(this.configuration.labelTargetsMeta[0].fullPath);

        this.configuration.labelTargets = Array.from(document.querySelectorAll(labelTargetsPath));

        this.configuration.labelTargets.forEach(item => {
            Highlighter.highlightElement(item, Profiler.elementTypes.ACTION_LABEL);
        });
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

            DynamicEventHandler.addHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionTargetHandlers.handleOneTimeMouseClick);
        });

        // select individual label
        document.querySelector(`#${this.containerId} #label-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual label input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.actionLabelHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionLabelHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionLabelHandlers.handleOneTimeMouseClick);
        });

        // select all similar siblings
        document.querySelector("#sel-similar").addEventListener("click", (e) => {
            e.stopPropagation();

            if(!this.verifyIndividualTargets())   return;
            this.populateSimilarIndividualTargets();

            if(!this.verifyLabelTargets())   return;
            this.populateSimilarLabelTargets();
        });
    };

    showMenu = () => {
        this.menu.classList.remove("hide");
        this.overlay.classList.remove("hide");
    }

    open = (event) => {     
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);
        this.configuration.parentContainer =  { element: event.target, fullPath: event.path };
        this.menu.innerHTML = this.getMenuHTML();
        this.showMenu();
        this.setFormEventListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}