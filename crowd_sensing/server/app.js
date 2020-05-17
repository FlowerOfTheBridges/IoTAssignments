// Include the cluster module
const cluster = require('cluster');
const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

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
} else {
    
    AWS.config.region = process.env.REGION;
    
    var ddb = new AWS.DynamoDB.DocumentClient();
    var ddbTable =  process.env.CROWD_SENSING_TABLE;

    var app = express();

    app.use(bodyParser.json());

    app.use(session({
        secret: 'sshhhhhh',
        resave: false,
        saveUninitialized: true,
        unset: 'destroy',
        name: 'userId',
        genid: (req) => {
            // http://www.ietf.org/rfc/rfc4122.txt
            let s = [];
            let hexDigits = "0123456789abcdef";
            for (let i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
            s[8] = s[13] = s[18] = s[23] = "-";

            let uuid = s.join("");
            return uuid;
        }
    }));
    
    app.get('/start', function(req, res){
        res.sendStatus(200);
    });

    app.get('/stop', function(req, res){
        if(req.session){ // if session was defined
            req.session.destroy();
            res.sendStatus(200);
        }
        else{
            res.sendStatus(412); //412: Precondition Failed
        }
    });
    /**
     * endpoint for retrieving last values from sensors in an hour.
     * req body must be of the type {sensor: "string"} where the value
     * represents the name of the sensor we want to filter
     */
    app.get('/last', (function(req, res) {
        console.log("last");
        
        let params = {
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
                data && data.Items && data.Items.forEach((function(item) {
    
                }).bind(this));
                res.json({});
            }
        }).bind(this));
        
    }).bind(this));

    /**
     * endpoint for retrieving last values received by the mqtt client listening
     * on the topic
     */
    app.get('/latest', (function(req, res) {
        let params = {
            TableName: ddbTable
        };

        ddb.scan(params, (function(err, data) {
            let crowd = {};
            if (err) {
                console.error("error: %s", err);
                res.json(err);
            } else {
                data && data.Items && data.Items.forEach((function(item) {
                    if(!crowd[item.id]){
                        crowd[item.id] = [];
                    }

                    crowd[item.id] && crowd[item.id].push({'ts': item.ts, 'x': item.x || 0, 'y': item.y || 0, 'z': item.z || 0, 'status': item.status || ""});
                    
                }).bind(this));

                res.json(crowd);
            }
        }).bind(this));
    }).bind(this));

    app.post('/publish', (function(req, res){
        let body = req.body;
        let id = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    req.connection.socket.remoteAddress;
        
        let status = body.status || null;
        
        if(body.cloudBased){
            
            // do model
        }

        var params = {
            TableName: ddbTable,
            Item:{
                "ts": body.ts,
                "id": id ,
                "info":{
                    "x": body.x,
                    "y": body.y,
                    "z": body.z,
                    "status": status
                }
            }
        };
        
        console.log("Adding a new item...");
        ddb.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item to "+ddbTable+". Error JSON:", JSON.stringify(err, null, 2));
                res.sendStatus(500);
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
                res.sendStatus(200);
            }
        });
    }).bind(this));

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}