var id = sessionStorage.getItem('crowdSensingId');
var socket = null;
var tid = null;
var crowd = null;
var currentUser = null;

/**
 * JSON object sended through the WS connection
 */
var request = {
    action: "getsamples", // action that the ws endpoint must take 
    message: {
        lastHour: false // latest value by default
    }
};


window.onbeforeunload = function () {
    socket && socket.close();
    tid && clearInterval(tid);
    return false;
}

/**
 * Function associated to the onload evt listener. 
 */
window.onload = function () {
    /** set lasthour - latest request transition  */
    setModes();
    setModes("mobile");
    // Create WebSocket connection.
    socket = new WebSocket('wss://yvmf1zyr60.execute-api.us-east-1.amazonaws.com/crowd_sensing');

    // Connection opened
    socket.addEventListener('open', (function (event) {
        console.log("connected to aws websocket!");
        console.log("sending request: %o", request);
        socket.send(JSON.stringify(request));
    }).bind(this));

    // Listen for messages
    socket.addEventListener('message', (function (event) {
        console.log("received %s: ", event.data);
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

    // Listen for errors
    socket.addEventListener('error', (function (err) {
        console.log("received error %s: ", err);
        let errorDOMElement = document.getElementById("error");
        errorDOMElement.hidden = false;
        errorDOMElement.innerHTML = "WebSocket error";
    }).bind(this));

    tid = setInterval((function () { // every 2 minutes i call aws to check whether new samples have been processed 
        socket.send(JSON.stringify(request));
    }).bind(this), 120000);
}