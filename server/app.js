// Include the cluster module
const cluster = require('cluster');
const AWS = require('aws-sdk');
const fs = require('fs');
const express = require('express');
const MqttClient = require('./core/mqtt-client');
const Configuration = require('./core/entities/configuration');
const bodyParser = require('body-parser');

const CONFIG_FILE_PATH = __dirname+'/static/resources/config.json';

this.stations = {};
this.sensorFromLastHour = [];
this.availableSensors = [
    {n: 'Temperature', v: 'temperature'}, 
    {n: 'Humidity', v: 'humidity'}, 
    {n: 'Wind Direction', v: 'winddirection'}, 
    {n: 'Wind Height', v: 'windheight'}, 
    {n: 'Rain', v: 'rain'}
];

/**
 * Receives messages from the mqtt topic and store the station measure in local storage
 * @param {string} topic 
 * @param {string} msg 
 */
function receiveMqttMessage(topic, msg){
    console.log('received msg %s from topic %s ', msg, topic);
    let obj = JSON.parse(msg);
    this.stations[obj.id] = obj;
    console.log('station now are %s', JSON.stringify(this.stations));
}

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    
    let config = new Configuration();
    Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8')));
    
    config.keyPath = __dirname + config.keyPath;
    config.certPath = __dirname + config.certPath;
    config.caPath = __dirname + config.caPath;
    
    var mqttClient = new MqttClient("AWS", config);
    AWS.config.region = process.env.REGION;
    
    var ddb = new AWS.DynamoDB.DocumentClient();
    var ddbTable =  process.env.WEATHER_TABLE;

    var app = express();

    app.use(express.static(__dirname + '/views'));
    app.use(bodyParser.json());
    /**
     * End point for the web app page
     */
    app.get('/', function(req,res){
        res.render('index');
    })

    /**
     * endpoint for retrieving last values from sensors in an hour.
     * req body must be of the type {sensor: "string"} where the value
     * represents the name of the sensor we want to filter
     */
    app.post('/last', (function(req, res) {
        let sensor = req.body.sensor;
        console.log("req with body "+sensor);
        
        var params = {
            TableName: ddbTable
        };

        ddb.scan(params, (function(err, data) {
            if (err) {
                console.log("Error", err);
                res.json(err);
            } else {
                this.sensorFromLastHour = [];
                let lastHourDate = new Date();
                lastHourDate.setHours(lastHourDate.getHours()-1); 
                data && data.Items && data.Items.forEach((function(element, index, array) {
                    //let sensors = JSON.parse(JSON.stringify(element.Payload.M));
                    //let sensors1 = element.Payload.M.sensors
                    //console.log("ts %d, name: %s sensors: %s sensors1: %s",element.ts.N,element.Payload.S.name, JSON.stringify(sensors), JSON.stringify(sensors1));
                    element.Payload.ts > lastHourDate && this.sensorFromLastHour.push({name: element.Payload.name, ts: element.Payload.ts, value: element.Payload.sensors[sensor].value});
                }).bind(this));
                res.json({ts: lastHourDate.getTime(), sensorList: this.sensorFromLastHour});
            }
        }).bind(this));
        
    }).bind(this));

    /**
     * endpoint for retrieving last values received by the mqtt client listening
     * on the topic
     */
    app.post('/latest', (function(req, res) {
        res.json({ts: new Date().getTime(), stations: this.stations, availableSensors: this.availableSensors});
    }).bind(this));

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });

    mqttClient.subscribe(config.topic, receiveMqttMessage.bind(this));
}