var Popup = function(id, headline, message) {
    var template = document.getElementById("template-popup").innerHTML;
    this.popupElement = document.createElement("div");
    template.replace("{{popupHeadline}}", headline);
    template.replace("{{popupText}}", message);
    this.popupElement.className = "popup";
    this.popupElement.innerHTML = template;
    this.popupElement.id = id;
    var title = document.getElementsByClassName("popup-title");
    console.log(Object.keys(title));
    this.popupElement.children[0].children[0].children[0].innerHTML = headline; // .popup -> .popup-content -> .popup-title -> h3
    this.popupElement.children[0].children[1].children[0].innerHTML = message; // .popup -> .popup-content -> .popup-message -> span
    this.popupElement.children[0].children[2].children[0].addEventListener("click", this.closeWindow.bind(this)); // .popup -> .popup-content -> .popup-controll -> close button
    this.popupVisible = false;
}

Popup.prototype.showWindow = function() {
    if(this.popupVisible != true) {
        this.popupElement.style.display = "block";
        document.body.appendChild(this.popupElement);
        this.popupVisible = true;
    }
}

Popup.prototype.closeWindow = function(e) {
    if(this.popupVisible) {
        this.popupElement.parentNode.removeChild(this.popupElement);
        this.popupVisible = false;
    }
}

Popup.prototype.addControlButton = function(id, text) {
    var newButton = document.createElement("button");
    newButton.id = id;
    newButton.type = "button";
    newButton.innerHTML = text;
    newButton.className = "popup-button";
    this.popupElement.children[0].children[2].insertBefore(newButton, this.popupElement.children[0].children[2].firstChild);
    return newButton;
}