

/**
 * Leafgrow object represents the main application.
 * It contains various properties and methods for initializing and managing the application.
 */
const Leafgrow = {
    config: null,
    body: null,
    alert_placeholder: null,
    wrapper: null,
    content: null,
    header: null,
    header_toggle: null,
    header_toggle_icon: null,
    header_title: null,
    page: null,
    footer: null,
    websocket: null,

    assetsUrl:  "",
    deviceUrl:  "/",

    /**
     * Initializes the application.
     */
    init: async function() {
        
        this.getAssetsUrl();

        // console.log("leafgrow init");
        const title = document.createElement("title");
        title.innerHTML = "Leafgrow";
        document.head.appendChild(title);

        await this.loadBootstrapCss();
        this.loadHeadLinks();

        var soket = await this.getSocket();
        this.config = await this.loadConfig();
        this.pumps_config = await this.loadPumpConfig();

        await this.loadBootstrapJs();

        this.createPage();

        Menu.changePage();
    },

    /**
     * Gets the URL of the assets.
     * 
     * @returns {string} - The URL of the assets.
     */
    getAssetsUrl: function() {
        var url = document.querySelector('script[src*="leafgrow.js"]').src;
        var path = url.split('/');
        path.pop();
        this.assetsUrl = path.join('/') + "/";
        // console.log("assetsUrl", this.assetsUrl);
    },

    /**
     * Gets the WebSocket connection.
     * 
     * @returns {Promise<WebSocket>} - A promise that resolves with the WebSocket connection.
     */
    getSocket: async function() {
        while (this.websocket && this.websocket.readyState == 0) {
            // console.log("reusing the socket connection [state = " + this.websocket.readyState + "]: " + this.websocket.url);
            await new Promise(r => setTimeout(r, 1000));   
        }

        if(this.websocket && this.websocket.readyState == 1) {
            // console.log("reusing the socket connection [state = " + this.websocket.readyState + "]: " + this.websocket.url);
            return this.websocket;
        }

        var that = this;
        return new Promise(function (resolve, reject) {
            var gateway = `ws://${window.location.hostname}/ws`;
            that.websocket = new WebSocket(gateway);
            that.websocket.onopen    = function(event) { resolve(that.websocket) };
            that.websocket.onerror   = function(event) { reject(event) };

            that.websocket.onclose   = that.onClose;
            that.websocket.onmessage = that.onMessage;
        });
    },

    /**
     * OnOpen WebSocket event handlers
     * 
     * @param {Event} event - The event object.
     */
    onOpen: function (event) {
        // console.log('Connection opened');
        resolve(that.websocket);
    },

    /**
     * OnClose WebSocket event handlers
     * 
     * @param {Event} event - The event object. 
     */
    onClose: function (event) {
        // console.log('Connection closed');
        setTimeout(Leafgrow.getSocket, 2000);
    },

    /**
     * OnMessage WebSocket event handlers
     * 
     * @param {Event} event - The event object.
     */
    onMessage: function (event) {
        this.last_msg = JSON.parse(event.data);
        var msg_event = new CustomEvent(this.last_msg.action, { "detail": this.last_msg});
        dispatchEvent(msg_event);
    },

    /**
     * Loads the configuration from the device.
     *
     * @returns {Promise<Object>} - A promise that resolves with the configuration. 
     */
    loadConfig: async function() {
        var socket = await this.getSocket();
        socket.send('{"action":"get-config"}');
        return new Promise(function(resolve, reject) {
            window.addEventListener('get-config', function(event) {
                // console.log("get config method ", event.detail);
                resolve(event.detail);
            }, { once: true });
        });
    },

    /**
     * Loads the pump configuration from the server.
     * @returns {Promise<string>} A promise that resolves with the pump configuration.
     */
    loadPumpConfig: async function() {
        var socket = await Leafgrow.getSocket();
        const that = this;
        return new Promise((resolve) => {
            
            socket.send('{"action":"get-pump-config"}');
            window.addEventListener('get-pump-config', function(event) {
                // Leafgrow.pump_config = event.detail.pumps;
                // console.log("get pump config method ", event.detail);
                resolve(event.detail.pumps);
            }, { once: true });
            
        });
    },

    /**
     * Loads the head links.
     */
    loadHeadLinks: async function() {
        this.loadLink(this.assetsUrl + 'images/logo.svg', 'icon', 'image/svg+xml', 'anonymous');
        await this.loadCss(this.assetsUrl + 'css/style.css', null, 'anonymous');

        var icon_demansions = ["72", "96", "128", "144", "152", "192", "384", "512"];
        icon_demansions.forEach(function(dem) {
            Leafgrow.loadLink(Leafgrow.assetsUrl + 'images/icons/lg-' + dem + '.png', 'apple-touch-icon', 'image/png', 'anonymous');
        });
    },

    /**
     * Loads the Bootstrap CSS.
     */
    loadBootstrapCss: async function() {
        await this.loadCss('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css', "sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN", "anonymous");
        await this.loadCss('https://cdn.jsdelivr.net/npm/boxicons@latest/css/boxicons.min.css');
        await this.loadCss('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');
    },

    /**
     * Loads the Bootstrap JS.
     */
    loadBootstrapJs: async function() {
        await this.loadJs('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', 'sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL', 'anonymous');
    },

    /**
     *  Loads a link element with the specified URL, rel, type, and crossorigin attributes.
     * 
     * @param {string} url - The URL of the link.
     * @param {string} [rel=null] - The rel attribute of the link.
     * @param {string} [type=null] - The type attribute of the link.
     * @param {string} [crossorigin=null] - The crossorigin attribute of the link.
     */
    loadLink: function(url, rel = null, type = null, crossorigin = null) {
        const head  = document.getElementsByTagName('head')[0];
        const link  = document.createElement('link');
        if (rel != null) {
            link.rel = rel;
        }

        if (type != null) {
            link.type = type;
        }
        if (crossorigin != null) {
            link.crossorigin = crossorigin;
        }
        link.href = url;
        head.appendChild(link);
    },

    /**
     *  Loads a CSS file with the specified URL, integrity, and crossorigin attributes.
     * 
     * @param {string} url - The URL of the CSS file.
     * @param {string} [integrity=null]  - The integrity attribute of the CSS file.
     * @param {string} [crossorigin=null]  - The crossorigin attribute of the CSS file.
     * 
     * @returns {Promise} - A promise that resolves when the CSS file is loaded.
     */
    loadCss: function(url, integrity = null, crossorigin = null) {
        return new Promise(function(resolve, reject) {
            const head  = document.getElementsByTagName('head')[0];
            const link  = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            // if (integrity != null) {
            //     link.integrity = integrity;
            // }
            if (crossorigin != null) {
                link.crossorigin = crossorigin;
            }
            link.href = url;
            link.media = 'all';
            head.appendChild(link);
            link.onload = resolve;
            link.onerror = reject;
        });
    },

    /**
     * 
     * @param {string} url - The URL of the JS file.
     * @param {string} integrity - The integrity attribute of the JS file.
     * @param {string} crossorigin - The crossorigin attribute of the JS file. 
     * 
     * @returns {Promise} - A promise that resolves when the JS file is loaded.
     */
    loadJs: function(url, integrity = null, crossorigin = null) {
        return new Promise(function(resolve, reject) {
            const body = document.getElementsByTagName("body")[0];
            const script = document.createElement('script');
            script.type = 'text/javascript';
            // if (integrity != null) {
            //     script.integrity = integrity;
            // }
            if (crossorigin != null) {
                script.crossorigin = crossorigin;
            }
            script.src = url;
            body.appendChild(script);
            script.onload = resolve;
            script.onerror = reject;
        });
    },

    /**
     * Hide the loader.
     */
    hideLoader: function() {
        const loader = document.querySelector(".loader");
        loader.style.transition = "opacity 1s";
        const loader_msg = document.querySelector(".loader-msg");
        loader_msg.innerHTML = "Connected!";
        setTimeout(function() { loader.style.opacity = "0"; }, 500);
        setTimeout(function() { loader.remove(); }, 2000);
    },


    /**
     * Creates the main page.
     */
    createPage: function() {

        // console.log("createPage");

        // set body margin to 0
        this.body = document.getElementsByTagName("body")[0];
        this.body.id = "body-pd";
        
        var header = this.createHeader();

        this.alert_placeholder = document.createElement("div");
        this.alert_placeholder.id = "alert_placeholder";
        this.body.appendChild(this.alert_placeholder);

        // create menu
        this.body.appendChild(Menu.render());

        // create wrapper
        this.wrapper = document.createElement("div");
        this.wrapper.id = "wrapper";
        this.wrapper.appendChild(header);
        this.body.appendChild(this.wrapper);


        // create content
        this.content = document.createElement("div");
        this.content.id = "content";
        this.wrapper.appendChild(this.content);

        // render default page
        this.page = document.createElement("div");
        this.page.id = "page";
        this.content.appendChild(this.page);

        // create footer
        this.footer = document.createElement("div");
        this.footer.id = "footer";
        this.footer.innerHTML = "© 2023 Leafgrow |&nbsp;" ;
        this.footer.version = document.createElement("span");
        this.footer.version.id = "footer_version";
        this.footer.version.innerHTML = Leafgrow.config.firmware_version;
        this.footer.appendChild(this.footer.version);

        this.content.appendChild(this.footer);

        this.hideLoader();
    },

    /**
     * Creates the header element.
     * 
     * @returns {HTMLElement} - The created header element.
     */
    createHeader: function() {

        this.header = document.createElement("div");
        this.header.id = "header";
        this.header.className = "header";

        const left = document.createElement("div");
        left.className = "d-flex";
        this.header_toggle = document.createElement("div");
        this.header_toggle.className = "header_toggle";
        left.appendChild(this.header_toggle);

        this.header_toggle_icon = document.createElement("i");
        this.header_toggle_icon.className = "bx bx-menu";
        this.header_toggle_icon.id = "header-toggle";
        this.header_toggle.appendChild(this.header_toggle_icon);

        this.header_title = document.createElement("h2");
        this.header_title.className = "header_title";
        this.header_title.innerHTML = "Leafgrow";
        left.appendChild(this.header_title);

        // display the temperature
        const right = document.createElement("div");
        this.header_temperature = document.createElement("div");
        this.header_temperature.className = "header_temperature";
        this.header_temperature.innerHTML = Leafgrow.config.temp  > 0 ? Leafgrow.config.temp + "°C" : "";
        right.appendChild(this.header_temperature);

        this.header.appendChild(left);
        this.header.appendChild(right);

        return this.header;
    },

    /**
     * Clears the content of the page.
     */
    clearContent: function() {
        if (this.page) {
            this.page.innerHTML = "";
        }
    },

    /**
     * Renders the page.
     */
    renderPage: function(pageContent) {
        // console.log("renderPage ", typeof(pageContent), " ", pageContent);
        this.page.appendChild(pageContent);
    },


    /**
     * Check if firmware version is greater than or equal to the specified version.
     * 
     * @param {string} version - The version to compare.
     * @returns {boolean} - True if the firmware version is greater than or equal to the specified version; otherwise, false.
     * @example
     * // returns true
     */
        version_is_greaten_or_equal(version) {
            return compare_versions(Leafgrow.config.firmware_version, version) >= 0 || Leafgrow.config.firmware_version == 'v0.0.0';
        }
};

const Menu = {

    menu: null,
    loadPage: "home",

    icons: {
        home: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="currentColor" height="24px" width="24px" version="1.1" id="Capa_1" viewBox="0 0 486.196 486.196" xml:space="preserve"><g><path d="M481.708,220.456l-228.8-204.6c-0.4-0.4-0.8-0.7-1.3-1c-5-4.8-13-5-18.3-0.3l-228.8,204.6c-5.6,5-6,13.5-1.1,19.1   c2.7,3,6.4,4.5,10.1,4.5c3.2,0,6.4-1.1,9-3.4l41.2-36.9v7.2v106.8v124.6c0,18.7,15.2,34,34,34c0.3,0,0.5,0,0.8,0s0.5,0,0.8,0h70.6   c17.6,0,31.9-14.3,31.9-31.9v-121.3c0-2.7,2.2-4.9,4.9-4.9h72.9c2.7,0,4.9,2.2,4.9,4.9v121.3c0,17.6,14.3,31.9,31.9,31.9h72.2   c19,0,34-18.7,34-42.6v-111.2v-34v-83.5l41.2,36.9c2.6,2.3,5.8,3.4,9,3.4c3.7,0,7.4-1.5,10.1-4.5   C487.708,233.956,487.208,225.456,481.708,220.456z M395.508,287.156v34v111.1c0,9.7-4.8,15.6-7,15.6h-72.2c-2.7,0-4.9-2.2-4.9-4.9   v-121.1c0-17.6-14.3-31.9-31.9-31.9h-72.9c-17.6,0-31.9,14.3-31.9,31.9v121.3c0,2.7-2.2,4.9-4.9,4.9h-70.6c-0.3,0-0.5,0-0.8,0   s-0.5,0-0.8,0c-3.8,0-7-3.1-7-7v-124.7v-106.8v-31.3l151.8-135.6l153.1,136.9L395.508,287.156L395.508,287.156z"/></g></svg>',
        pump: '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><style>.a{opacity:.3}.b{fill:currentColor;stroke:currentColor}</style><path fill="currentColor" class="a" d="m22 8.2v7.5c0 3.4-2.8 6.3-6.3 6.3h-7.5c-3.4 0-6.2-2.8-6.2-6.3v-7.5c0-3.4 2.8-6.2 6.2-6.2h7.5c3.5-0.1 6.3 2.7 6.3 6.2zm-10-0.9c-2.5 0-4.6 2.1-4.6 4.6 0 2.5 2.1 4.6 4.6 4.6 2.5 0 4.6-2.1 4.6-4.6 0-2.6-2.1-4.6-4.6-4.6z"/><path fill="currentColor" d="m12 17.5c-3.1 0-5.6-2.5-5.6-5.6 0-3.1 2.5-5.6 5.6-5.6 3.1 0 5.6 2.5 5.6 5.6 0 3.1-2.5 5.6-5.6 5.6zm0-9.2c-2 0-3.6 1.6-3.6 3.6 0 2 1.6 3.6 3.6 3.6 2 0 3.6-1.6 3.6-3.6 0-2-1.6-3.6-3.6-3.6z"/><path fill="currentColor" class="b" d="m16.4 10.6l-0.1 11.3"/><path fill="currentColor" class="b" d="m7.4 10.6l-0.1 11.3"/></svg>',
        update: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.3" d="M21 13H15V11H21C21.6 11 22 10.6 22 10C22 9.4 21.6 9 21 9H15V3C15 2.4 14.6 2 14 2C13.4 2 13 2.4 13 3V9H11V3C11 2.4 10.6 2 10 2C9.4 2 9 2.4 9 3V9H3C2.4 9 2 9.4 2 10C2 10.6 2.4 11 3 11H9V13H3C2.4 13 2 13.4 2 14C2 14.6 2.4 15 3 15H9V21C9 21.6 9.4 22 10 22C10.6 22 11 21.6 11 21V15H13V21C13 21.6 13.4 22 14 22C14.6 22 15 21.6 15 21V15H21C21.6 15 22 14.6 22 14C22 13.4 21.6 13 21 13Z" fill="currentColor"/><path d="M16 17H8C7.4 17 7 16.6 7 16V8C7 7.4 7.4 7 8 7H16C16.6 7 17 7.4 17 8V16C17 16.6 16.6 17 16 17ZM14 10H10V14H14V10Z" fill="currentColor"/></svg>',
        settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 11H6.5C4 11 2 9 2 6.5C2 4 4 2 6.5 2H17.5C20 2 22 4 22 6.5C22 9 20 11 17.5 11ZM15 6.5C15 7.9 16.1 9 17.5 9C18.9 9 20 7.9 20 6.5C20 5.1 18.9 4 17.5 4C16.1 4 15 5.1 15 6.5Z" fill="currentColor"/><path opacity="0.3" d="M17.5 22H6.5C4 22 2 20 2 17.5C2 15 4 13 6.5 13H17.5C20 13 22 15 22 17.5C22 20 20 22 17.5 22ZM4 17.5C4 18.9 5.1 20 6.5 20C7.9 20 9 18.9 9 17.5C9 16.1 7.9 15 6.5 15C5.1 15 4 16.1 4 17.5Z" fill="currentColor"/></svg>',
    },

    init: function() {
        // console.log("Menu init");
    },


    render: function() {
        this.menu = document.createElement("div");
        this.menu.id = "nav-bar";
        this.menu.className = "l-navbar";

        const nav = document.createElement("nav");
        nav.className = "nav";
        this.menu.appendChild(nav);

        const logo_link = document.createElement("a");
        logo_link.href = "#";
        logo_link.className = "nav_logo";

        // add logo to sidebar
        const logo = document.createElement("i");
        logo.className = "nav_logo-icon";
        logo_link.appendChild(logo);
        nav.appendChild(logo_link);

        const nav_list = document.createElement("div");
        nav_list.className = "nav_list";
        nav.appendChild(nav_list);

        const home = this.createMenuButton("home", "Acasă");
        nav_list.appendChild(home);
        this.addAction(home, this.changePage);

        const pumps = this.createMenuButton("pump", "Pompe");
        nav_list.appendChild(pumps);
        this.addAction(pumps, this.changePage);

        const update = this.createMenuButton("update", "Update");
        nav_list.appendChild(update);
        if (Leafgrow.config.available_firmware_version &&
            Leafgrow.config.available_firmware_version !== Leafgrow.config.firmware_version) {
            const badge = document.createElement("span");
            badge.className = "badge bg-danger ms-1";
            badge.style.cssText = "font-size:0.55rem;vertical-align:middle;padding:2px 5px;border-radius:8px;";
            badge.innerHTML = "NEW";
            update.appendChild(badge);
        }
        this.addAction(update, this.changePage);

        const settings = this.createMenuButton("settings", "Setari");
        nav_list.appendChild(settings);
        this.addAction(settings, this.changePage);

        this.showNavbar("header-toggle", "nav-bar", "body-pd", "header");

        return this.menu;
    },


    colorLink: function(link) {
        var linkColor = document.querySelectorAll('.nav_link')
        // console.log("colorLink");
         if(linkColor){
            linkColor.forEach(l=> l.classList.remove('active'))
            link.classList.add('active')
         }
    },

    createMenuButton: function(page, text,  url = null, icon = null) {
        const link = document.createElement("a");
        link.href= url || "#"+page;
        link.className = "nav_link";
        link.dataset.page = page;
        var hash = document.location.hash.split("#")[1];

        if (hash == page || (hash == "" && this.loadPage == page)) {
            link.classList.add("active");
        }

        if (icon != null) {
            const icon_el = document.createElement("i");
            icon_el.className = "bx bx-" + icon + " nav_icon";
            link.appendChild(icon_el);
        }   else if (this.icons[page] != null) {
            const icon_el = document.createElement("i");
            icon_el.className = "nav_icon";
            icon_el.innerHTML = this.icons[page];
            link.appendChild(icon_el);
        }

        const label = document.createElement("span");
        label.className = "nav_name";
        label.innerHTML = text.charAt(0).toUpperCase() + text.slice(1);
        link.appendChild(label);

        return link;
    },

    addAction: function(button, callback) {
        that = this;
        button.addEventListener("click", function() {
            that.colorLink(this)
            callback(this);

        });
    },

    changePage: function(el) {
        // console.log("changePage");
        if(Leafgrow.body.classList.contains('body-pd')){
            Menu.toggleNavbar();
        }
        Leafgrow.clearContent();
        var page = new Page();
        var hash = document.location.hash.split("#")[1];
        // console.log("changePage", el, hash);
        var page_name = el ? el.dataset.page : hash ? hash : Menu.loadPage;
        switch(page_name) {
            case "home":
                page = new Home();
                break;
            case "pump":
                page = new Pumps();
                break;
            case "update":
                page = new Update();
                break;
            case "settings":
                page = new Settings();
                break;

        }


        page.render();

    },

    showNavbar: function() {
        var that = this;
        // console.log("showNavbar");

        Leafgrow.header_toggle_icon.addEventListener('click', ()=>{
           that.toggleNavbar();
        })

    },

    toggleNavbar: function() {
        // console.log("toggleNavbar");
         // show navbar
         that.menu.classList.toggle('show')
         // change icon
         Leafgrow.header_toggle_icon.classList.toggle('bx-x')
         // add padding to body
         Leafgrow.body.classList.toggle('body-pd')
         // add padding to header
         // Leafgrow.header.classList.toggle('body-pd')
    }


};

/**
 * Represents a page in the application.
 */
class Page {
    constructor() {
        this.page = document.createElement("div");
        this.page.id = "page";
        this.title = "";
    }

    /**
     * Creates a page and updates the header title.
     */
    createPage() {
        Leafgrow.header_title.innerHTML = this.title;
    }

    /**
     * Creates a loading card element.
     * @returns {HTMLElement} The created loading card element.
     */
    createLoadingCard() {
        const card = document.createElement("div");
        card.className = "card card-placeholder loading-card";
        card.dataset.ariaHidden = "true";
        card.innerHTML = '<div class="card-header"><h3 class="card-title placeholder-glow"><span class="placeholder col-4"></span></h3></div><div class="card-body placeholder-glow "><div><p class="card-text col-12"><span class="placeholder col-1 me-1"></span><span class="placeholder col-3 me-1"></span><span class="placeholder col-5 me-1"></span></p><p class="card-text col-12"><span class="placeholder col-3 me-1"></span><span class="placeholder col-2 me-1"></span><span class="placeholder col-5 me-1"></span></p><p class="card-text col-12"><span class="placeholder col-2 me-1"></span><span class="placeholder col-5 me-1"></span><span class="placeholder col-2 me-1"></span></p></div></div>';
        return card;
    }

    /**
     * Creates a card element with optional title and footer.
     *
     * @param {string|HTMLElement} content - The content of the card. It can be a string or an HTML element.
     * @param {string|HTMLElement|null} [title=null] - The title of the card. It can be a string, an HTML element, or null.
     * @param {string|HTMLElement|null} [footer=null] - The footer of the card. It can be a string, an HTML element, or null.
     * @returns {HTMLElement} The created card element.
     */
    createCard(content, title = null, footer = null) {
        const card = document.createElement("div");
        card.className = "card";

        if (title != null) {
            card.header = document.createElement("div");
            card.header.className = "card-header";
            if (typeof(title) == "string") {
                card.header.innerHTML = "<h3>" + title + "</h3>";
            } else {
                card.header.appendChild(title);
            }
            card.appendChild(card.header);
        }

        card.body = document.createElement('div');
        card.body.className = "card-body";
        if (typeof(content) == "string") {
            card.body.innerHTML = content;
        } else {
            card.body.appendChild(content);
        }
        card.appendChild(card.body);

        if (footer  != null) {
            card.footer = document.createElement("div");
            card.footer.className = "card-footer";
            if (typeof(footer) == "string") {
                card.footer.innerHTML = footer;
            } else {
                card.footer.appendChild(footer);
            }
            card.appendChild(card.footer);
        }

        return card;
    }

    /**
     * Creates an input element with the specified attributes.
     * @param {string} label - The label for the input element.
     * @param {string} type - The type of the input element.
     * @param {string} name - The name attribute of the input element.
     * @param {any} [value=null] - The initial value of the input element.
     * @param {string} [placeholder=null] - The placeholder text for the input element.
     * @param {function} [onChangeCallback=null] - The callback function to be executed when the input value changes.
     * @param {Object} [options=null] - The options for the input element.
     * @returns {HTMLInputElement|HTMLDivElement} - The created input element or input group div.
     */
    createInput(label, type, name, value = null, placeholder = null, onChangeCallback = null, options = null) {
        const input = document.createElement("input");
        input.className = "form-control";
        input.id = name;
        input.type = type;
        input.name = name;
        if (value != null) {
            input.value = value;
        }
        if (placeholder != null) {
            input.placeholder = placeholder;
        }

        const div = document.createElement("div");
        div.className = "input-group mb-3";
        const label_el = document.createElement("label");
        label_el.textContent = label;
        label_el.htmlFor = input.id;
        label_el.className = "input-group-text";
        if (options && typeof options.info != "undefined") {
            label_el.appendChild(this.createInfoIcon(options.info));
            delete options.info;
        }

        if (options != null) {
            for (const key in options) {
                input.setAttribute(key, options[key]);
            }
        }

        div.appendChild(label_el);
        div.appendChild(input);

        if (onChangeCallback != null) {
            input.addEventListener("change", onChangeCallback.bind(this, input));
        }

        if (type == "hidden") {
            return input;
        }
        return div;
    }

    createInfoIcon(info) {
        const icon = document.createElement("i");
        icon.className = "bi bi-info-circle px-1";
        icon.title = info;
        icon.setAttribute("data-bs-toggle", "tooltip");
        icon.setAttribute("data-bs-placement", "top");
        new bootstrap.Tooltip(icon);
        return icon;
    }


    /**
     * Creates a switch element with a label.
     *
     * @param {string} label - The label text for the switch.
     * @param {string} name - The name attribute for the switch.
     * @param {boolean} checked - The initial checked state of the switch (default: false).
     * @param {function} onChangeCallback - The callback function to be called when the switch value changes (default: null).
     * @returns {HTMLDivElement} - The created switch element.
     */
    createSwitch(label, name, checked = false, onChangeCallback = null) {

        const input = document.createElement("input");
        input.className = "form-check-input";
        input.id = name;
        input.type = "checkbox";
        input.name = name;
        input.checked = checked;

        const label_el = document.createElement("label");
        label_el.className = "form-check-label";
        label_el.innerHTML = label;

        const div = document.createElement("div");
        div.className = "form-check form-switch ";
        div.appendChild(input);
        div.appendChild(label_el);

        if (onChangeCallback != null) {
            input.addEventListener("change", onChangeCallback.bind(this, input));
        }

        return div;
    }


    /**
     * Creates a checkbox element with the specified label, name, value, checked state, and onChange callback.
     *
     * @param {string} label - The label text for the checkbox.
     * @param {string} name - The name attribute for the checkbox.
     * @param {string} value - The value attribute for the checkbox.
     * @param {boolean} checked - The initial checked state of the checkbox (default: false).
     * @param {function} onChangeCallback - The callback function to be called when the checkbox value changes (default: null).
     * @returns {HTMLDivElement} - The created checkbox element.
     */
    createCheckbox(label, name, value, checked = false, onChangeCallback = null) {

        const input = document.createElement("input");
        input.className = "form-check-input";
        input.id = name;
        input.type = "checkbox";
        input.name = name;
        input.checked = checked;
        input.value = value;

        const label_el = document.createElement("label");
        label_el.className = "form-check-label";
        label_el.innerHTML = label;
        label_el.htmlFor = input.id;

        const div = document.createElement("div");
        div.className = "form-check form-check-inline";

        div.appendChild(input);
        div.appendChild(label_el);
        if (onChangeCallback != null) {
            input.addEventListener("change", onChangeCallback.bind(this, input));
        }

        return div;
    }


    /**
     * Creates a radio button element with the specified label, name, value, checked state, and onChange callback.
     *
     * @param {string} label - The label for the radio button.
     * @param {string} name - The name attribute for the radio button.
     * @param {string} value - The value attribute for the radio button.
     * @param {boolean} [checked=false] - The initial checked state of the radio button.
     * @param {Function} [onChangeCallback=null] - The callback function to be called when the radio button's value changes.
     * @returns {HTMLDivElement} - The created radio button element.
     */
    createRadio(label, name, value, checked = false, onChangeCallback = null) {

        const input = document.createElement("input");
        input.className = "btn-check";
        input.id = name + "_" + value;
        input.type = "radio";
        input.name = name;
        input.value = value;
        input.checked = checked;

        const label_el = document.createElement("label");
        label_el.className = "btn btn-outline-primary";
        label_el.innerHTML = label;
        label_el.htmlFor = input.id;

        const div = document.createElement("div");
        div.className = "mx-1";
        div.appendChild(input);
        div.appendChild(label_el);

        if (onChangeCallback != null) {
            input.addEventListener("change", onChangeCallback.bind(this, input));
        }

        return div;
    }

    /**
     * Creates a select element with the specified label, name, options, and onChange callback.
     * 
     * @param {string} label - The label for the select element.
     * @param {string} name - The name attribute for the select element.
     */
    createAccordion(id, className = "") {
        const accordion = document.createElement("div");
        accordion.id = id;
        accordion.className = "accordion" + (className ? " " + className : "");
        return accordion;
    }

    /**
     * Creates an accordion item with the specified title and content.
     * 
     * @param {string} id - The id of the accordion.
     * @param {string} title - The title of the accordion item.
     * @param {string|HTMLElement} content - The content of the accordion item.
     * @param {boolean} [expanded=false] - The initial expanded state of the accordion item.
     */
    createAccordionItem(id, title, content, expanded = false) {
        var slug = title.toLowerCase().replace(/ /g, "_");
        const item = document.createElement("div");
        item.className = "accordion-item";
        item.header = document.createElement("h2");
        item.header.className = "accordion-header";
        item.header_button = document.createElement("button");
        item.header_button.className = "accordion-button" + (expanded ? "" : " collapsed");
        item.header_button.type = "button";
        item.header_button.dataset.bsToggle = "collapse";
        item.header_button.dataset.bsTarget = "#" + slug + "_content";

        if (expanded) {
            item.header_button.setAttribute("aria-expanded", "true");
            item.header_button.setAttribute("aria-controls", slug + "_content");
        } else {
            item.header_button.setAttribute("aria-expanded", "false");
            item.header_button.setAttribute("aria-controls", slug + "_content");
        }
        item.header_button.innerHTML = title;
        item.header.appendChild(item.header_button);
        item.appendChild(item.header);


        item.content = document.createElement("div");
        item.content.id = slug + "_content";
        item.content.className = "accordion-collapse collapse" + (expanded ? " show" : "");
        item.content.dataset.bsParent = "#" + id;
        item.content.setAttribute("aria-labelledby", slug + "_header");
        item.content.setAttribute("data-bs-parent", "#" + id);

        item.content.body = document.createElement("div");
        item.content.body.className = "accordion-body";
        if (content instanceof HTMLElement) {
            item.content.body.appendChild(content);
        } else {
            item.content.body.innerHTML = content;
        }
        item.content.appendChild(item.content.body);
        item.appendChild(item.content);

        return item;
    }

    render() {
        this.createPage();
        Leafgrow.renderPage(this.page);
    }

    /**
     * Renders a message on the page.
     *
     * @param {string} message - The message to be rendered.
     * @param {string} [type="success"] - The type of the message (e.g., "success", "error", "warning").
     */
    renderMessage(message, type = "success") {
        // console.log("renderMessage", message, type);
        const message_div = document.createElement("div");
        message_div.className = "alert alert-" + type + " alert-dismissible";
        message_div.role = "alert";
        message_div.innerHTML = message;

        //add close button
        const close_button = document.createElement("button");
        close_button.type = "button";
        close_button.className = "btn-close";
        close_button.dataset.bsDismiss = "alert";
        close_button.ariaLabel = "Close";
        message_div.appendChild(close_button);

        Leafgrow.alert_placeholder.prepend(message_div);
        setTimeout(function() {
            message_div.style.transition = "opacity 1s";
            message_div.style.opacity = "0";
        }, 3000);

        setTimeout(function() {
            message_div.remove();
        }, 4000);
    }
}


class Home extends Page {

    constructor() {
        super();
        this.page.id = "home";
        this.title = "";
    }

    createPage() {
        super.createPage();
        
        var card_body = document.createElement("div");
        card_body.className = "card-body d-flex flex-row justify-content-center align-items-center";
        for (var i = 0; i < Leafgrow.pumps_config.length; i++) {
            var pump = Leafgrow.pumps_config[i];
            var percent = (pump.bottle_ml / pump.bottle_volume * 100).toFixed(0);
            
            // console.log("Pump " + pump.name + " ml per week: " +  ((pump.run_day.toString(2).split("1").length - 1) * pump.amount));
            if (Leafgrow.version_is_greaten_or_equal('v0.2.40')) {
                var time_to_empty = pump.repeat ? Math.floor(pump.bottle_ml / pump.amount) : pump.bottle_ml / ((pump.run_day.toString(2).split("1").length - 1) * pump.amount);
                var time_unit = pump.repeat ? ' zile' : ' săptămâni'; 
            } else {
                var time_to_empty = pump.repeat == 'daily' ? Math.floor(pump.bottle_ml / pump.amount) : pump.bottle_ml / (pump.run_day.length  * pump.amount);
                var time_unit = pump.repeat == 'daily' ? ' zile' : ' săptămâni';
            }
            var bottle_container = document.createElement("div");
            bottle_container.className = "bottle-container m-3 d-flex flex-column justify-content-center align-items-center";
            var bottle = document.createElement("div");
            bottle.className = "bottle m-3";

            var bottle_filled = document.createElement("div");
            bottle_filled.className = "bottle-filled";
            bottle_filled.style.height = percent + "%";
            bottle.appendChild(bottle_filled);

            var bottle_img = document.createElement("img");
            bottle_img.src = Leafgrow.assetsUrl + "images/bottle.svg";
            bottle_img.alt = "Sticla";
            bottle_img.className = "bottle-img";
            bottle.appendChild(bottle_img);

            var bottle_label = document.createElement("div");
            bottle_label.className = "bottle-label";
            bottle_label.innerHTML = pump.name + " (" + time_to_empty.toFixed() + time_unit +")";

            bottle_container.appendChild(bottle);
            bottle_container.appendChild(bottle_label);
            
            card_body.appendChild(bottle_container);
        }
        const card = this.createCard(card_body, "LeafGrow");
        this.page.appendChild(card);

    }

}



/**
 * Represents a Pumps page.
 * @extends Page
 */
class Pumps extends Page {
    constructor() {
        super();
        this.page.id = "pumps";
        this.title = "Configurator pompe";
        this.selected_pump = null;
        this.spinning_pump = null;
    }


    /**
     * Creates a page and performs necessary operations.
     */
    async createPage() {
        super.createPage();
        const that = this;
        // const loading_card = this.createLoadingCard();
        // this.page.appendChild(loading_card);

        this.pumps_config = Leafgrow.pumps_config;
        this.createPumpsCard();
    }

    /**
     * Creates a pumps card and appends it to the page.
     */
    createPumpsCard() {
        
        const tabs = this.createPumpTabs();
        const form = this.createPumpForm();
        const card_header = document.createElement("div");
        const card_body = document.createElement("div");

        card_header.className = "card-pump";
        card_header.appendChild(tabs);

        
        const accordion = this.createAccordion('pump-accordion');
        accordion.appendChild(this.createAccordionItem('pump-accordion', 'Acțiuni manuale', this.createManualActions()));
        accordion.appendChild(this.createAccordionItem('pump-accordion', 'Configurare', form, true));

        card_body.appendChild(accordion);

        const card = this.createCard(card_body, card_header);
        this.page.appendChild(card);
        this.changePumpTab(tabs, form);
    }

    /**
     * Creates pump tabs.
     * @returns {HTMLElement} The created div element containing the pump tabs.
     */
    createPumpTabs() {
        const tabs = document.createElement("div");
        tabs.className = "nav nav-tabs justify-content-end card-header-tabs";
        tabs.id = "pump-tabs";
        tabs.role = "tablist";
        const nrOfTabs = this.pumps_config.length;
        // console.log("createPumpTabs", this.pumps_config);
        for (var i = 0; i < nrOfTabs; i++) {
            if (i == 0) {
                this.selected_pump = this.pumps_config[i];
            }
            const pump = this.pumps_config[i];
            const tab = document.createElement("a");
            tab.className = "nav-item nav-link d-inline pump_tab_" + pump.id + (i == 0 ? " active" : "");
            tab.innerHTML = '<span>' + pump.name + '</span> ';
            tab.href = "#";
            tab.dataset.pumpId = pump.id;
            tab.addEventListener("click", this.clickPumpTab.bind(this, tab));
            tabs.appendChild(tab);

        }

        return tabs;
    }

    /**
     * Handles the click event for the pump tab.
     * @param {HTMLElement} el - The element that triggered the event.
     */
    clickPumpTab(el) {
        // console.log("clickPumpTab");
        const tabs = document.getElementById("pump-tabs");
        tabs.querySelector(".active").classList.remove("active");
        el.classList.add("active");
        this.changePumpTab();
    }

    /**
     * Changes the pump tab and updates the form with the selected pump's data.
     */
    changePumpTab(tabs = null, form = null)
    {
        if (!tabs) {
            tabs = document.getElementById("pump-tabs");
        }

        if (!form) {
            form = document.getElementById("pump-form");
        }

        if (!tabs || !form)  {
            return;
        }
        const active_tab = tabs.querySelector(".active");
        const pump_id = active_tab.dataset.pumpId;
        const pump = this.pumps_config.find(pump => pump.id == pump_id);
        this.selected_pump = pump;
        // console.log("changePumpTab", pump);
        

        const hour = pump.run_hour < 10 ? "0" + pump.run_hour : pump.run_hour;
        const minute = pump.run_minute < 10 ? "0" + pump.run_minute : pump.run_minute;

        form.querySelector("#pump_id").value = pump.id;
        form.querySelector("#name").value = pump.name;
        form.querySelector("#enabled").checked = pump.enabled;
        form.querySelector("#run_hour").value = hour + ":" + minute;
        form.querySelector("#amount").value = pump.amount;
        

        if (Leafgrow.version_is_greaten_or_equal('v0.2.40')) {
            form.querySelector("#repeat_1").checked = pump.repeat;
            form.querySelector("#repeat_0").checked = !pump.repeat;
            form.querySelector("#run_day_0").checked = (pump.run_day & 1) != 0;
            form.querySelector("#run_day_1").checked = (pump.run_day & 2) != 0;
            form.querySelector("#run_day_2").checked = (pump.run_day & 4) != 0;
            form.querySelector("#run_day_3").checked = (pump.run_day & 8) != 0;
            form.querySelector("#run_day_4").checked = (pump.run_day & 16) != 0;
            form.querySelector("#run_day_5").checked = (pump.run_day & 32) != 0;
            form.querySelector("#run_day_6").checked = (pump.run_day & 64) != 0;
        } else {
            form.querySelector("#repeat_daily").checked = pump.repeat == "daily";
            form.querySelector("#repeat_weekly").checked = pump.repeat == "weekly";
            form.querySelector("#run_day_0").checked = pump.run_day.includes(0);
            form.querySelector("#run_day_1").checked = pump.run_day.includes(1);
            form.querySelector("#run_day_2").checked = pump.run_day.includes(2);
            form.querySelector("#run_day_3").checked = pump.run_day.includes(3);
            form.querySelector("#run_day_4").checked = pump.run_day.includes(4);
            form.querySelector("#run_day_5").checked = pump.run_day.includes(5);
            form.querySelector("#run_day_6").checked = pump.run_day.includes(6);
        }

        this.repeatChange(form.querySelector("[name='repeat']:checked").value);

        form.querySelector("#bottle_volume").value = pump.bottle_volume;
        form.querySelector("#bottle_ml").value = Math.round( (pump.bottle_ml * 100) / pump.bottle_volume);
        form.querySelector("#ml_per_sec").value = Math.round((pump.ml_per_sec+ Number.EPSILON) * 10000) / 10000;

        this.spinning_pump.pump_img.classList.remove("running");
        this.setRunPumpButtonState(pump.state == "running");

    }

    /**
     * Creates manual actions for the device.
     * @returns {HTMLElement} The container element for the manual actions.
     */
    createManualActions() {
        const quick_actions = document.createElement("div");
        quick_actions.className = "d-flex justify-center flex-column align-items-center mt-3 mb-3"; 

        var spinning_pump = {};
        spinning_pump.container = document.createElement("div");
        spinning_pump.container.className = "pump-container";
        spinning_pump.container.style.backgroundImage = "url(" + Leafgrow.assetsUrl + "images/pump_bg.svg)";
        
        spinning_pump.pump_img = document.createElement("img");
        spinning_pump.pump_img.src = Leafgrow.assetsUrl + "images/pump_rolers_3.svg";
        spinning_pump.pump_img.alt = "Pompa";
        spinning_pump.pump_img.className = "pump-img";
        spinning_pump.container.appendChild(spinning_pump.pump_img);

        quick_actions.appendChild(spinning_pump.container);
        this.spinning_pump = spinning_pump;

        var input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-5 col-lg-3 col-xl-2 mt-3";
        var form_text = document.createElement("span");
        form_text.className = "form-text text-muted";
        form_text.innerHTML = "ml";
        form_text.className = "input-group-text";
        var input = this.createInput("Cantitate", "number", "manual_run_amount", 10, null, null, {min: 0, max: this.selected_pump.bottle_ml, step: 0.1, info:"Cantitatea de fertilizant în mililitri"});
        input.appendChild(form_text);
        input_wrapper.appendChild(input);
        quick_actions.appendChild(input_wrapper);

        var button = this.createRunButton()
        quick_actions.appendChild(button);

        window.addEventListener("pump-state", function(event) {
            // console.log("pump-state", this.selected_pump.id,  event.detail);
            var button_desired_state = event.detail.state == "running" ? "true" : "false";
            if (event.detail.pump_id == this.selected_pump.id && button.dataset.running != button_desired_state) {
                this.setRunPumpButtonState(event.detail.state == "running");
            }
        }.bind(this));

        return quick_actions;

    }

    // Create a run button.
    createRunButton() {
        const button = document.createElement("button");
        button.className = "btn btn-primary";
        button.id = "run-pump";
        button.innerHTML = "Run";
        button.dataset.running = "false";
        button.addEventListener("click", this.togglePump.bind(this));
        return button;
    }

    // Create a stop button.
    setRunPumpButtonState(running = false) {
        const button = document.getElementById("run-pump");
        if (!button) {
            return;
        }
        if (running) {
            button.innerHTML = "Stop";
            button.classList.add("btn-danger")
            button.classList.remove("btn-primary");
            button.dataset.running = "true";
            this.spinning_pump.pump_img.classList.add("running");
        } else {
            button.innerHTML = "Run";
            button.classList.add("btn-primary")
            button.classList.remove("btn-danger");
            button.dataset.running = "false";
            this.spinning_pump.pump_img.classList.remove("running");
        }
    }

    // Run the pump.
    togglePump(event) {
        // console.log(event);
        const pump = this.selected_pump;
        const amount = document.getElementById("manual_run_amount").value;
        Leafgrow.getSocket().then(function(socket) {
            if (event.target.dataset.running == "false") {
                this.setRunPumpButtonState(true);
                socket.send('{"action":"run-pump", "pump_id":' + pump.id + ', "amount":' + amount + '}');
                this.renderMessage("Pompa " + pump.name + " a fost pornită.", "success");
            } else {
                this.setRunPumpButtonState(false);
                socket.send('{"action":"stop-pump", "pump_id":' + pump.id + '}');
                this.renderMessage("Pompa " + pump.name + " a fost oprită.", "success");
            }
        }.bind(this));
    }

    // Stop the pump.
    stopPump() {
        // console.log("stopPump");
        const pump = this.selected_pump;
        const that = this;
        Leafgrow.getSocket().then(function(socket) {
            socket.send('{"action":"stop-pump", "pump_id":' + pump.id + '}');
            that.renderMessage("Pompa " + pump.name + " a fost oprită.", "success");
        });
    }


    /**
     * Creates a pump form element.
     * @returns {HTMLFormElement} The created form element.
     */
    createPumpForm() {
        const form = document.createElement("form");
        form.className = "needs-validation";
        form.id = "pump-form";

        // Pump id
        form.appendChild(this.createInput("", "hidden", "pump_id", 1));

        var form_text = document.createElement("span");
        form_text.className = "form-text text-muted";

        var input = null;

        const row_1 = document.createElement("div");
        row_1.className = "row g-3 mb-3 align-items-start";

        // Enabled
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-3 col-sm-2 col-md-3 col-lg-2 col-xl-1 mt-4";
        input_wrapper.appendChild(this.createSwitch("Activ", "enabled", true));
        row_1.appendChild(input_wrapper);

        // Nume
        var input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-3 col-md-6 col-lg-4 col-xl-3 mt-4";
        input_wrapper.appendChild(this.createInput("Nume", "text", "name", "Pompa 1"));
        row_1.appendChild(input_wrapper);

        // Repetare
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-9 col-sm-4 col-md-4 col-lg-3 col-xl-2  mt-3  d-flex justify-content-end justify-content-md-start";
        input_wrapper.appendChild(this.createRadio("Zilnic", "repeat", Leafgrow.version_is_greaten_or_equal('v0.2.40') ? '1' : 'daily', true, this.repeatChange));
        input_wrapper.appendChild(this.createRadio("Săptămânal", "repeat", Leafgrow.version_is_greaten_or_equal('v0.2.40') ? '0' : 'weekly', false, this.repeatChange));
        row_1.appendChild(input_wrapper);

        // Ziua
        input_wrapper = document.createElement("div");
        input_wrapper.id = "run_day_wrapper";
        input_wrapper.className = "form-group col-sm-6 col-md-12 col-lg-5 mt-4";
        if (Leafgrow.version_is_greaten_or_equal('v0.2.40')) {
            input_wrapper.appendChild(this.createCheckbox("Lu", "run_day_1", 2, true));
            input_wrapper.appendChild(this.createCheckbox("Ma", "run_day_2", 4, true));
            input_wrapper.appendChild(this.createCheckbox("Mi", "run_day_3", 8, true));
            input_wrapper.appendChild(this.createCheckbox("Jo", "run_day_4", 16, true));
            input_wrapper.appendChild(this.createCheckbox("Vi", "run_day_5", 32, true));
            input_wrapper.appendChild(this.createCheckbox("Sâ", "run_day_6", 64, true));
            input_wrapper.appendChild(this.createCheckbox("Du", "run_day_0", 1, true));
        } else {
            input_wrapper.appendChild(this.createCheckbox("Lu", "run_day_1", 1, true));
            input_wrapper.appendChild(this.createCheckbox("Ma", "run_day_2", 2, true));
            input_wrapper.appendChild(this.createCheckbox("Mi", "run_day_3", 3, true));
            input_wrapper.appendChild(this.createCheckbox("Jo", "run_day_4", 4, true));
            input_wrapper.appendChild(this.createCheckbox("Vi", "run_day_5", 5, true));
            input_wrapper.appendChild(this.createCheckbox("Sâ", "run_day_6", 6, true));
            input_wrapper.appendChild(this.createCheckbox("Du", "run_day_0", 0, true));
        }
        row_1.appendChild(input_wrapper);


        // Row 2
        const row_2 = document.createElement("div");
        row_2.className = "row g-3 mb-3 align-items-start";

        // Ora
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-4 col-lg-4 col-xl-2";
        input_wrapper.appendChild(this.createInput("Ora", "time", "run_hour", "12:00", null, null, {info: "Ora la care se va porni pompa."}));
        row_2.appendChild(input_wrapper);

        // Cantitatea
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-5 col-lg-3 col-xl-2";
        form_text = document.createElement("span");
        form_text.className = "form-text text-muted";
        form_text.innerHTML = "ml";
        form_text.className = "input-group-text";
        input = this.createInput("Doza", "number", "amount", 10, null, null, {min: 0, max: 100, info: "Cantitatea de fertilizant eliberată."});
        input.appendChild(form_text);
        input_wrapper.appendChild(input);

        row_2.appendChild(input_wrapper);


        // Row 3
        const row_3 = document.createElement("div");
        row_3.className = "row g-3 mb-3 align-items-start";

        // Volum sticla
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-4 col-lg-3 col-xl-2";
        form_text = document.createElement("span");
        form_text.className = "form-text text-muted";
        form_text.innerHTML = "ml";
        form_text.className = "input-group-text";
        input = this.createInput("Volum", "number", "bottle_volume", 1000, null, null, {min: 0, max: 10000, info: "Volumul recipientului in care se afla fertilizantul."});
        input.appendChild(form_text);
        input_wrapper.appendChild(input);
        row_2.appendChild(input_wrapper);


        // Nivel sticla
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-5 col-lg-3 col-xl-2";
        form_text = document.createElement("span");
        form_text.className = "form-text text-muted";
        form_text.innerHTML = "%";
        form_text.className = "input-group-text";
        input = this.createInput("Nivel", "number", "bottle_ml", null, null, null, {min: 0, max: 100, info: "Nivelul de fertilizant din sticlă."});
        input.appendChild(form_text);
        input_wrapper.appendChild(input);
        row_2.appendChild(input_wrapper);

        // Calibrare
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-sm-2 col-md-5 col-lg-3 col-xl-3";
        form_text = document.createElement("span");
        form_text.className = "form-text text-muted";
        form_text.innerHTML = "ml/sec";
        form_text.className = "input-group-text";
        input = this.createInput("Debit", "number", "ml_per_sec", 1, null, null, {step: 0.001, min: 0, max: 2, info: "Cantitatea de fertilizant eliberată intr-o secundă."});
        input.appendChild(form_text);
        input_wrapper.appendChild(input);
        row_2.appendChild(input_wrapper);



        // Row 3
        const row_4 = document.createElement("div");
        row_4.className = "row g-3 mb-3 align-items-start";

        // Save button
        input_wrapper = document.createElement("div");
        input_wrapper.className = "form-group col-auto";
        input = document.createElement("button");
        input.className = "btn btn-primary";
        input.type = "submit";
        input.innerHTML = "Salvează";
        input_wrapper.appendChild(input);
        row_4.appendChild(input_wrapper);


        form.appendChild(row_1);
        form.appendChild(row_2);
        // form.appendChild(row_3);
        form.appendChild(row_4);

        form.addEventListener("submit", this.submitPumpForm.bind(this));
        return form;
    }

    /**
     * Submits the pump form data to the server.
     *
     * @param {Event} event - The event object.
     * @returns {Promise<void>} - A promise that resolves when the form data is successfully submitted.
     */
    async submitPumpForm(event) {
        var that = this;
        event.preventDefault();
        // console.log("submitPumpForm");
        const form = document.getElementById("pump-form");
        var formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const run_time = data.run_hour.split(":");
        data.run_hour = run_time[0];
        data.run_minute = run_time[1];
        if (Leafgrow.version_is_greaten_or_equal('v0.2.40')) {
            data.run_day = 0;
            for ( var i = 0; i < 7; i++) {
                if (data["run_day_" + i]) {
                    data.run_day += parseInt(data["run_day_" + i]);
                }
                delete data["run_day_" + i];
            }
        } else {
            data.run_day = [];
            for ( var i = 0; i < 7; i++) {
                if (data["run_day_" + i]) {
                    data.run_day.push(parseInt(data["run_day_" + i]));
                }
                delete data["run_day_" + i];
            }
        }

        data.bottle_ml = data.bottle_volume / 100 * data.bottle_ml;
        data.ml_per_sec = parseFloat(data.ml_per_sec.replace(",", "."));

        formData = new FormData();
        formData.append("config", JSON.stringify(data));
        formData.append("pump_id", data.pump_id);

        var socket = await Leafgrow.getSocket();
        socket.send('{"action":"save-pump-config", "data":' + JSON.stringify(data) + '}');
        window.addEventListener('save-pump-config', function(event) {
            // console.log("save-pump-config", event.detail);
            if(event.detail.data == "ok") {
                that.renderMessage("Datele au fost salvate cu succes.");
            } else {
                that.renderMessage("A apărut o eroare la salvarea datelor.", "danger");
            }
        }, { once: true });

        this.pumps_config = this.pumps_config.map(pump => {
            if (pump.id == data.pump_id) {
                // Merge pump config with changed data
                pump = {...pump, ...data};
            }
            return pump;
        });

        const tabs = document.getElementById("pump-tabs");
        const active_tab = tabs.querySelector(".active").innerHTML = data.name;

    }

    /**
     * Handles the change event for the repeat input element.
     * @param {HTMLElement} el - The input element triggering the change event.
     */
    repeatChange(el) {
        // console.log("repeatChange" , el.value);
        var repeat = el;
        if (typeof(repeat) == "object") {
            repeat = el.value;
        }
        const run_day_wrapper = document.getElementById("run_day_wrapper");
        if (!run_day_wrapper) {
            return;
        }

        if (Leafgrow.version_is_greaten_or_equal('v0.2.40') ? repeat == "0" : repeat == "weekly") {
            run_day_wrapper.classList.remove("d-none");
        } else {
            run_day_wrapper.classList.add("d-none");
        }
    }
};

/**
 * Represents a settings page.
 * @extends Page
 */
class Settings extends Page {
    constructor() {
        super();
        this.page.id = "settings";
        this.title = "Setari";
    }

    createPage() {
        super.createPage();

        const card_title = document.createElement("h3");
        card_title.innerHTML = "Setari generale";

        const card_header = document.createElement("div");
        card_header.className = "card-wifi";
        card_header.appendChild(card_title);

        const info = this.createInfoContainer();

        const card = this.createCard(info, card_header);
        this.page.appendChild(card);

    }

    createInfoContainer() {
        const info_container = document.createElement("div");
        info_container.className = "d-flex justify-content-center align-items-center flex-column";

        const data = {
            "IP": Leafgrow.config.IP,
            "MAC": Leafgrow.config.MAC,
            "SSID": Leafgrow.config.SSID,
            "Firmware Version": Leafgrow.config.firmware_version,
            "Firmware Disponibil": Leafgrow.config.available_firmware_version
        };
        
        for (const key in data) {
            const row = document.createElement("div");
            row.className = "d-flex justify-content-between align-items-center col-12 col-md-8 col-lg-6 col-xl-2 mb-2";
            row.innerHTML = "<span>" + key + ": </span><span>" + data[key] + "</span>";
            info_container.appendChild(row);
        }

        return info_container;
    }

};

/**
 * Represents a settings page.
 * @extends Page
 */
class Update extends Page {
    constructor() {
        super();
        this.page.id = "update";
        this.title = "Actualizare firmware";
        this.progress = null;
        this.info = null;
        this.initiListeners();
    }

    initiListeners() {
        var that = this;
        window.addEventListener('update-firmware-progress', function(event) {
            // console.log("update-firmware-progress", event.detail);
            that.progress.progress_bar.style.width = event.detail.progress + "%";
        });

        window.addEventListener('update-firmware-started', function(event) {
            // console.log("update-firmware-progress", event.detail);
            that.info.innerHTML = "Se actualizeaza firmware-ul...";
            that.progress.style.visibility = "visible";
        });

        window.addEventListener('update-firmware-finished', async function(event) {
            // console.log("update-firmware-finished", event.detail);
            that.progress.style.visibility = "hidden";
            that.info.innerHTML = "Firmware-ul a fost actualizat cu succes.";
            that.progress.visibility = "hidden";

            await Leafgrow.loadConfig();
            Leafgrow.footer.version.innerHTML = Leafgrow.config.firmware_version;
        });

        window.addEventListener('update-firmware-error', function(event) {
            // console.log("update-firmware-error", event.detail);
            that.progress.style.visibility = "hidden";
            that.info.innerHTML = "A apărut o eroare la actualizarea firmware-ului.";
        });
    }

    createPage() {
        super.createPage();

        const card_title = document.createElement("h3");
        card_title.innerHTML = "Versiune firmware instalata: " + Leafgrow.config.firmware_version + " | Disponibila: " + Leafgrow.config.available_firmware_version;

        const card_header = document.createElement("div");
        card_header.className = "card-update";
        
        const card = this.createCard("", card_header);
        
        if (Leafgrow.config.firmware_version != Leafgrow.config.available_firmware_version) {
            
            var wrapper = document.createElement("div");
            wrapper.className = "d-flex justify-content-center align-items-center flex-column";
            this.info = document.createElement("p");
            this.info.innerHTML = "O noua versiune (" + Leafgrow.config.available_firmware_version + ") de firmware este disponibila.";
            wrapper.appendChild(this.info);

            this.progress = document.createElement("div");
            this.progress.className = "progress col-12 col-md-8 col-lg-6 col-xl-4 mb-2";
            this.progress.style.visibility = "hidden";
            this.progress.progress_bar = document.createElement("div");
            this.progress.progress_bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-success";
            this.progress.progress_bar.style.width = "0%";
            
            this.progress.progress_bar.setAttribute("role", "progressbar");
            

            this.progress.appendChild(this.progress.progress_bar);
            wrapper.appendChild(this.progress);
            
            
            const update_btn = document.createElement("button");
            update_btn.className = "btn btn-primary btn-sm flex-end";
            update_btn.innerHTML = "Update";

            update_btn.addEventListener("click", async function() {
                var socket = await Leafgrow.getSocket();
                socket.send('{"action":"update-firmware"}');
                window.addEventListener('update-firmware', function(event) {
                    // console.log("update-firmware", event.detail);
                }, { once: true });
            });
            wrapper.appendChild(update_btn);
            card.body.appendChild(wrapper);


        } else {
            const info = document.createElement("p");
            info.innerHTML = "Este instalata ultima versiune de firmware. Nu este necesara actualizarea.";
            card.body.appendChild(info);
        }

        card_header.appendChild(card_title);
        this.page.appendChild(card);
        
    }

};

compare_versions = function(a, b) {
    var i, diff;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
};

window.onload = function() {
    Leafgrow.init();
};

  /*
  {
    "id":4,
    "enabled":true,
    "repeat":"daily",
    "run_day":0,
    "run_hour":21,
    "run_minute":26,
    "amount":10,
    "ml_per_sec":0.870000005,
    "gpio_pin":5,
    "gpio_type":0
    }
  */
