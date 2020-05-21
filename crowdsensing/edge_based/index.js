
var id = sessionStorage.getItem('crowdSensingId');
const MOVING_IMG_SRC = "https://i.pinimg.com/originals/59/c9/6c/59c96c1e900214c64baec2023ca1e7f1.jpg";
const STAND_STILL_IMG_SRC = "https://vignette.wikia.nocookie.net/peanuts/images/2/28/AmigosperdemoSono.png/revision/latest/scale-to-width-down/340?cb=20110823202539";

window.onbeforeunload = function () {
    socket.close();
    return false;
}
window.onload = function () {

    try {
        if (!id) {
            console.log("No id found on sessionStorage. Generating ...");
            id = generateId();
            sessionStorage.setItem('crowdSensingId', id);
        }
        // Create WebSocket connection.
        const socket = new WebSocket('wss://yvmf1zyr60.execute-api.us-east-1.amazonaws.com/crowd_sensing');

        // Connection opened
        socket.addEventListener('open', (function (event) {
            document.getElementById("userId").innerHTML = id;
        }).bind(this));

        // Listen for messages
        socket.addEventListener('message', (function (event) {
            console.log("Received: %s" + event.body);
        }).bind(this));

        // Listen for ws errors
        socket.addEventListener('error', (function (event) {
            document.getElementById("error").innerHTML = "Received: " + event.data;
            document.getElementById("error").hidden = false;
        }).bind(this));

        // check whether user browser has acceleremoter tracking enabled
        navigator.permissions.query({ name: 'accelerometer' }).then(result => {
            if (result.state === 'denied') {
                document.getElementById("error").innerHTML = 'Permission to use accelerometer sensor is denied.';
                return;
            }

            let sensor = new LinearAccelerationSensor({ frequency: 1 });

            var measures = [];

            sensor.start();

            sensor.onreading = () => {
                document.getElementById("x").innerHTML = "X: " + sensor.x;
                document.getElementById("y").innerHTML = "Y: " + sensor.y;
                document.getElementById("z").innerHTML = "Z: " + sensor.z;

                measures.push({ x: sensor.x, y: sensor.y, z: sensor.z, ts: Date.now() });

                document.getElementById("samples").innerHTML = "Samples: " + measures.length + "/10";

                if (measures.length == 10) {
                    let smaValue = sma(measures);
                    let status = getStatus(smaValue);

                    document.getElementById("sma").innerHTML = "SMA: " + smaValue;
                    document.getElementById("statusText").innerHTML = status == 1 ? "Moving" : "Stand still";
                    document.getElementById("statusImg").src = status == 1 ? MOVING_IMG_SRC : STAND_STILL_IMG_SRC;

                    socket.send(JSON.stringify({
                        action: "store",
                        message: {
                            ts: Date.now(),
                            id: id,
                            status: status,
                            isCloudBased: false
                        }
                    }));

                    measures = [];
                }
            };

            sensor.onerror = (event) => {
                console.log(event.error.name, event.error.message);
                document.getElementById("error").innerHTML = "Sensor error: " + event.error.message + " [" + event.error.name + "]";
                document.getElementById("error").hidden = false;
            }
        }).catch(error => {
            document.getElementById("error").innerHTML = "Permission API not supported by your browser.";
            document.getElementById("error").hidden = false;
        });
    }
    catch (e) {
        let errorMsg = "";

        if (error.name === 'SecurityError') {
            errorMsg = 'Sensor construction was blocked by the Feature Policy.';
        } else if (error.name === 'ReferenceError') {
            errorMsg = 'Sensor is not supported by the User Agent.';
        } else {
            errorMsg = 'Error: ' + e;
        }

        document.getElementById("error").innerHTML = errorMsg;
        document.getElementById("error").hidden = false;
    }
}