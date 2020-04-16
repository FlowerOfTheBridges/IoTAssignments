const fs = require('fs');
const MqttClient = require('./core/mqtt-client');
const AWSConfiguration = require('./core/entities/configuration_aws');
const TTNConfiguration = require('./core/entities/configuration_ttn');
const VirtualStation = require('./core/entities/virtual-station');

const AWS_CONFIG_FILE_PATH = __dirname+"/resources/config_aws.json";
const TTN_CONFIG_FILE_PATH = __dirname+"/resources/config_ttn.json";

const DEFAULT_TOPIC = "weather";
const RIOT_PAYLOAD_SEPARATOR = "|";
const TTN_UPLINK_SEPARATOR = "_";

this.ttnClient = null;
this.awsClient = null;

this.awsConfig = new AWSConfiguration();
this.ttnConfig = new TTNConfiguration();

/**
 * This callback takes the message received by the TTN broker, parses it and sends to AWS IoT Broker
 * @param {string} devId must be in the form <station_cityname>
 * @param {string} hardwareSerial the mac code of the device who send the message.
 * @param {string} msg must be in the form <temp|humidity|winddir|windheight|rain>
 */
function callback(devId, hardwareSerial, msg){
  
  let virtualStation = null;
  try{
    const values = msg.split(RIOT_PAYLOAD_SEPARATOR);
    // i assume that devId is in the form station_cityname
    let city = devId.split(TTN_UPLINK_SEPARATOR)[1];
    if(city && values[0] && values[1] && values[2] && values[3] && values[4]) {
      virtualStation = new VirtualStation(city, hardwareSerial, "");
      virtualStation.setSensorsFromRiot(values[0], values[1], values[2], values[3], values[4]);
      this.awsClient.publish(DEFAULT_TOPIC, virtualStation);
    }
    else{
      console.warn("Not enough information retrieved from ttn. Publish to AWS denied.")
    }
  }
  catch(error){
    console.error("Invalid message format");
  }
}

/**
 * Main function of the gateway. Parse the configuration from config files and starts two MQTT client:
 * - one connected to the TTN broker
 * - one connected to AWS IoT Core broker
 * Then the TTN gateway will make a subscription to the uplink with a callback where the message will be retrieved and then parsed
 * into the AWS common JSON format
 */
if (require.main === module) {
  try{
      Object.assign(this.awsConfig, JSON.parse(fs.readFileSync(AWS_CONFIG_FILE_PATH, 'utf8')));
      this.awsConfig.keyPath = __dirname+this.awsConfig.keyPath;
      this.awsConfig.certPath = __dirname+this.awsConfig.certPath;
      this.awsConfig.caPath = __dirname+this.awsConfig.caPath;

      Object.assign(this.ttnConfig, JSON.parse(fs.readFileSync(TTN_CONFIG_FILE_PATH, 'utf8')));
  }
  catch(error){
      console.log("Invalid path provided. %s", error);
      process.exit(1);
  }
  this.ttnClient = new MqttClient('TTN', this.ttnConfig);
  this.awsClient = new MqttClient('AWS', this.awsConfig);
  this.ttnClient.subscribe(null, callback.bind(this));
}
