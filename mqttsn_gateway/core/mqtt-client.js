const awsIot = require('aws-iot-device-sdk/');
const Configuration = require('./entities/configuration');
const mqtt = require('mqtt');

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
    * @param {Configuration} config configuration obj retrieved from the config json file placed in the resources folder
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
            this.device  = mqtt.connect('mqtt://127.0.0.1', {port: 1886});
        }

        this.device
            .on('connect', (() =>{
                console.log('connected to %s broker.', broker);
            }).bind(this));
    }

    /**
     * Publish a particular message in a topic of choice (must be declared also in the IoT device's policy in order to work)
     * @param {string} topic
     * @param {any} data the message to send 
     */
    publish(topic, data){
        let msg = JSON.stringify(data);
        console.info('publishing msg %s on topic %s', msg, topic);
        data && this.device.publish(topic, msg);
    }

    /**
     * Listens to  a topic of choice (must be declared also in the IoT device's policy in order to work)
     * in order to retrieve mesages.
     * @param {string} topic 
     * @param {Function} appCallback function to be called a message is received
     */
    subscribe(topic, appCallback){
        this.device.subscribe(topic);
        this.device
            .on('message', function(topic, payload) {
                appCallback(topic, payload.toString());
            });
    }

}

module.exports = MqttClient.bind(this);
