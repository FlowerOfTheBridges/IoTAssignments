function setModes(section) {
    let overall = document.getElementById("overall" + (section != null ? "_mobile" : ""));
    let lastHour = document.getElementById("lasthour" + (section != null ? "_mobile" : ""));

    let overallLink = overall.children[0];
    let lastHourLink = lastHour.children[0];

    overallLink.addEventListener("click", () => { overall.setAttribute("class", "active"); lastHour.setAttribute("class", ""); changeMode(false); });
    lastHourLink.addEventListener("click", () => { overall.setAttribute("class", ""); lastHour.setAttribute("class", "active"); changeMode(true); });
}

function changeMode(value) {
    request.message.lastHour = value;
    console.log("sending: %o", request);
    socket.send(JSON.stringify(request));
}
function createRadio(div, id, name, value, text, callback) {
    if (!document.getElementById(id)) {
        let radio = radioInput = document.createElement('input');
        radioInput.setAttribute('type', 'radio');
        radioInput.setAttribute('name', name);
        radioInput.setAttribute("id", id);
        radioInput.setAttribute("value", value);
        radioInput.addEventListener("click", (event) => { callback(event.target.value) })
        radioLabel = document.createElement('label');
        radioLabel.setAttribute('for', id);
        radioLabel.appendChild(document.createTextNode(text));
        div.appendChild(radioInput);
        div.appendChild(radioLabel);
        div.appendChild(document.createElement('br'));
    }
}

function initDiv(divId, titleDiv) {
    let divDom = document.getElementById(divId);
    if (divDom) {
        divDom.textContent = "";
        let title = document.createElement('h4');
        title.textContent = titleDiv;
        divDom.appendChild(title);
    }
    return divDom;
}
function userCallback(userId) {
    console.log("event: %s %o", userId, crowd[userId]);
    currentUser = crowd[userId];
    let samples = initDiv("samplesDiv", "Samples");
    /** clear all div for analytics */
    clearAnalytics();
    /** create radio buttons for each sample group */
    currentUser && currentUser.forEach((item, index) => {
        let itemDate = new Date(item.ts);
        createRadio(samples, userId + "_" + item.ts, "samples", index, itemDate.toLocaleString(), sampleCallback);
    });
}

function clearAnalytics() {
    document.getElementById("status").textContent = "";
    document.getElementById("sma").textContent = "";
    document.getElementById("steps").textContent = "";
    initDiv("x", "X-Axis");
    initDiv("y", "Y-Axis");
    initDiv("z", "Z-Axis");
}

function sampleCallback(sampleId) {
    sample = currentUser[sampleId];
    console.log("event: %s %o", sampleId, sample);
    document.getElementById("status").textContent = sample.status == 1 ? "MOVING" : "STAND STILL";
    document.getElementById("sma").textContent = sample.sma ? sample.sma.toFixed(3) : "Not found (edge based client)";
    document.getElementById("steps").textContent = sample.steps ? sample.steps.toFixed(3) : "Not found (edge based client)";

    let xDiv = initDiv("x", "X-Axis");
    let yDiv = initDiv("y", "Y-Axis");
    let zDiv = initDiv("z", "Z-Axis");

    if(sample.measures){
        sample.measures.forEach(measure => {
            let x = document.createElement("p");
            x.textContent = measure.x.toFixed(3) + (measure.ts ? " (" + measure.ts.toLocaleString() + ")" : "");
            xDiv.appendChild(x);
            let y = document.createElement("p");
            y.textContent = measure.y.toFixed(3) + (measure.ts ? " (" + measure.ts.toLocaleString() + ")" : "");
            yDiv.appendChild(y);
            let z = document.createElement("p");
            z.textContent = measure.z.toFixed(3) + (measure.ts ? " (" + measure.ts.toLocaleString() + ")" : "");
            zDiv.appendChild(z);
        });
    }
    else{
        let x = document.createElement("p");
        x.textContent = "Measures from x-Axis not found(edge based client)";
        xDiv.appendChild(x);
        let y = document.createElement("p");
        y.textContent = "Measures from y-Axis not found(edge based client)";
        yDiv.appendChild(y);
        let z = document.createElement("p");
        z.textContent = "Measures from z-Axis not found(edge based client)";
        zDiv.appendChild(z);
    }
}