var id = sessionStorage.getItem('crowdSensingId');
var socket = null;
var tid = null;
var crowd = null;
var currentUser = null;

var request = {
    action: "getsamples",
    message: {
        lastHour: false, // latest value by default
        id: sessionStorage.getItem("crowdSensingId")
    }
};


window.onbeforeunload = function () {
    socket && socket.close();
    tid && clearInterval(tid);
    return false;
}

window.onload = function () {

    if (!this.request.message.id) { // render only if id has been found within local storage
        let errorDOMElement = document.getElementById("error");
        errorDOMElement.hidden = false;
        errorDOMElement.innerHTML = "No id found within local storage. Make sure that you started a Crowdsensing session before entering the dashboard.";
        document.getElementById("dashboard").hidden = true;
        document.getElementById("navHandler").hidden = true;
        return;
    }
    /** set lasthour - latest request transition  */
    setModes();
    setModes("mobile");
    // Create WebSocket connection.
    socket = new WebSocket('wss://yvmf1zyr60.execute-api.us-east-1.amazonaws.com/crowd_sensing');

    // Connection opened
    socket.addEventListener('open', (function (event) {
        console.log("connected to aws websocket!");
        //first request
        socket.send(JSON.stringify(request));
    }).bind(this));

    // Listen for messages
    socket.addEventListener('message', (function (event) {
        crowd = JSON.parse(event.data);
        console.log("received body: %o", crowd);
        let users = initDiv("usersDiv", "Users");
        /** clear all div for analytics */
        initDiv("samplesDiv", "Samples");
        clearAnalytics();
        /** create radio buttons for each sample group */
        let crowdKeys = Object.keys(crowd);
        document.getElementById("warning").hidden = crowdKeys && crowdKeys.length != 0;
        if (crowdKeys && crowdKeys.length != 0) {
            crowdKeys.forEach(item => {
                createRadio(users, item, "users", item, item, userCallback);
            });
        }
        else {
            document.getElementById("warning").innerHTML = "No samples found.";
        }
    }).bind(this));

    socket.addEventListener('error', (function (err) {
        let errorDOMElement = document.getElementById("error");
        errorDOMElement.hidden = false;
        errorDOMElement.innerHTML = "WebSocket error";
    }).bind(this));

    tid = setInterval((function () { // every 2 minutes i call aws to check whether new samples have been processed 
        socket.send(JSON.stringify(request));
    }).bind(this), 120000);
}