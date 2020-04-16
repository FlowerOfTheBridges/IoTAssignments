const awsIot = require('aws-iot-device-sdk/');
const Configuration = require('./entities/configuration_aws');
const mqtt = require('mqtt');
const ttn = require('ttn');

/**
 * The class MqttClient represent a client which uses the mqtt protocol to
 * publish data on a particular topic associated to device. This device is
 * located inside the AWS IoT hub, so the following files are needed  in the resources folder:
 * - Ca.crt : file representing the certification authority of aws services.
 * - device.cert.pem : certificate of the particulare device in the hub
 * - device.private.key : private key of the particular device in the hub
 */
class MqttClient{
    
    /**
    * 
    * @param {any} config configuration obj retrieved from one of the config json 
    * file placed in the resources folder. May be of two types:
    *   - AWSConfiguration: configuration for the AWS IoT Core broker
    *   - TTNConfiguration: configuration for the TTN MQTT broker
    * Configuration file is not needed for the MOSQUITTO local broker.
    */
    constructor(broker, config){
        if(broker == 'AWS'){
            this.device = awsIot.device({
                keyPath: config.keyPath,
                certPath: config.certPath,
                caPath: config.caPath,
                clientId: String(config.clientId+Math.random().toString(36).substring(7)),
                host: config.host
            });
        }   
        else if(broker == 'MOSQUITTO'){
            this.device = mqtt.connect('mqtt://127.0.0.1', {port: 1886});
        }
        else if(broker == 'TTN') {
            console.log("connecting to %s over ttn network.", config.appId);
            this.device = ttn.data(config.appId, config.accessKey);
        }
        else {
            return null;
        }

        this.broker = broker;

        if(this.broker!='TTN'){
            this.device
                .on('connect', (() =>{
                    console.log('connected to %s broker.', broker);
                }).bind(this));
        }
    }

    /**
     * Publish a particular message in a topic of choice (must be declared also in the IoT device's policy in order to work)
     * @param {string} topic
     * @param {any} data the message to send 
     */
    publish(topic, data){
        if(this.broker!='TTN'){
            let msg = JSON.stringify(data);
            console.info('publishing msg %s on %s topic %s', msg, this.broker, topic);
            data && this.device.publish(topic, msg);
        }
        else { // publishing on ttn broker not immplemented yet
            return null;
        }
    }

    /**
     * Listens to  a topic of choice (must be declared also in the IoT device's policy in order to work)
     * in order to retrieve mesages.
     * @param {string} topic not needed for TTN broker
     * @param {Function} appCallback function to be called a message is received
     */
    subscribe(topic, appCallback) {
        if(this.broker!='TTN') {
            this.device.subscribe(topic);
            this.device
                .on('message', function(topic, payload) {
                    appCallback(topic, payload.toString());
                });
        }
        else {
            this.device
                .then(function (client) {
                    client.on('uplink', function(devId, payload) {
                        let buff = Buffer.from(payload.payload_raw, 'base64');
                        let msg = buff.toString('ascii');      
                        console.log("received %s from %s's %s with raw message: %s .",payload, this.broker, devId,msg);
                        appCallback(devId, payload.hardware_serial, msg);
                    }.bind(this));
                }.bind(this))
                .catch(function (err) {
                    console.error(err)
                    process.exit(1);
                })
            }
    }

}

module.exports = MqttClient.bind(this);
