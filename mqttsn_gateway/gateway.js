const fs = require('fs');
const MqttClient = require('./core/mqtt-client');
const Configuration = require('./core/entities/configuration');
const VirtualStation = require('./core/entities/virtual-station');

const TIMEOUT_DEFAULT_MILLIS = 30000;
const CONFIG_FILE_PATH = __dirname+"/resources/config.json";

const DEFAULT_TOPIC = "riot/weather";
const SEPARATOR = "|";

this.localClient = null;
this.awsClient = null;
this.config = new Configuration();

/**
 * This callback takes the message received by the MQTTSN broker, parses it and sends to AWS IoT Broker
 * @param {string} topic where the message has been published
 * @param {string} msg must be in the form <temp>|<hum>|<wind_dir>|<wind_int>|<rain>|<id> , otherwise no message will be sent
 */
function callback(topic, msg){
  console.log("received %s on topic %s.",msg, topic);
  let virtualStation = null;

  try{
    const values = msg.split(SEPARATOR);
    virtualStation = new VirtualStation(values[5], "");
    virtualStation.setSensorsFromRiot(values[0], values[1], values[2], values[3], values[4]);
    this.awsClient.publish(this.config.topic, virtualStation);
  }
  catch(error){
    console.log("Invalid message format");
  }

  virtualStation && this.awsClient.publish(this.config.topic, virtualStation);
}

/**
 * Main function of the gateway. Parse the configuration from config file and starts two MQTT client:
 * - one connected to the MQTTSN broker
 * - one connected to AWS IoT Core broker
 * Then the gateway submit its subscrition to the topic where the message will be retrieved and then parsed
 * into the AWS common JSON format
 */
if (require.main === module) {
  try{
      Object.assign(this.config, JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8')));
      this.config.keyPath = __dirname+this.config.keyPath;
      this.config.certPath = __dirname+this.config.certPath;
      this.config.caPath = __dirname+this.config.caPath;
  }
  catch(error){
      console.log("Invalid path provided. %s", error);
      process.exit(1);
  }
  this.localClient = new MqttClient('MOSQUITTO', null);
  this.awsClient = new MqttClient('AWS', this.config);
  this.localClient.subscribe(DEFAULT_TOPIC, callback.bind(this));
}


//setInterval((()=>{client.publish('topic','ciao')}).bind(this),1000);