const fs = require('fs');
const Configuration = require('./core/entities/configuration');
const MqttClient = require('./core/mqtt-client');
const VirtualStation = require('./core/entities/virtual-station');
const axios = require('axios');

const TIMEOUT_DEFAULT_MILLIS = 30000;
const CONFIG_FILE_PATH = './resources/config.json';
const OPENWEATHER_URL = "http://api.openweathermap.org/data/2.5/weather?q={0},{1}&APPID={2}";

this.topic = 'weather';
this.station = null;
this.mqttClient = null;
this.url = null;
this.config = new Configuration();

/**
 * main function of the client. it creates an mqttclient using the configuration located
 * inside the file /resources/config.json in order to publish 
 * the values retrieved from the virtual station to the weather channel.
 */
if (require.main === module) {
    try{
        Object.assign(this.config, JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8')));
    }
    catch(error){
        console.log("Invalid path provided.");
        process.exit(1);
    }
    try{
        let city = null;
        let countryZone = null;

        city = process.argv[2];
        countryZone = process.argv[3];

        if(!city && !countryZone){
            throw 'no input';
        }
        else{
            this.station = new VirtualStation(city, countryZone);
            this.url = OPENWEATHER_URL.replace("{0}", this.station.name).replace("{1}", this.station.countryZone).replace("{2}", this.config.token);
    
            this.mqttClient = new MqttClient("AWS", this.config);
            setInterval(restCall.bind(this), TIMEOUT_DEFAULT_MILLIS);
        }
        
    }
    catch(err){
        console.log("two parameters needed: city and country code. for a list of available country code, visit https://timezonedb.com/time-zones");
        process.exit(1);
    }
    

    
}

function restCall() {
    console.debug('Calling %s for in order to get values from station based on %s (%s)', this.url, this.station.name, this.station.countryZone);
    axios.get(this.url).then((msg) =>{
        let data = msg.data ? msg.data : null;
        if(data!=null){
            this.station.setSensorsFromOpenWeather(data);
            this.mqttClient.publish(this.topic, this.station);
        }
        else{
            console.debug("Error parsing data from station");
        }
    })
    .catch(err => {
        console.info("Invalid http request. %s", err);
    });
    
}
