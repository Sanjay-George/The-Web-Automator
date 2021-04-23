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

