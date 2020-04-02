const Sensor = require('./sensor');
const KELVIN_CONVERSION = 273.15;

/**
 * The virtual station class represents an enviromental station located in some
 * part of the world, and has a set of values of different sensors, such as:
 *  -   temperature (-50 ... 50 Celsius)
    -   humidity (0 ... 100%)
    -   wind direction (0 ... 360 degrees)
    -   wind intensity (0 ... 100 m/s)
    -   rain height (0 ... 50 mm / h) 
 */
class VirtualStation {
    static DEFAULT_ID = 111;
    /**
     * Creates a new virtual station
     * @param {string} name,of the city where the station is placed
     * @param {string} countryZone representing the country of the city. list of available country codes here: https://timezonedb.com/time-zones
     */
    constructor(name, countryZone){
        this.sensors = {};
        this.name = name;
        this.countryZone = countryZone;
    }

    /**
     * Fill the sensor values given the ones obtained from the open weather
     * @param {JSON} openWeather obj retrieved from api.
     * https://openweathermap.org/current#current_JSON
     */
    setSensorsFromOpenWeather(openWeather){
        let ts = new Date().getTime(); // we can use alternatively the ts provided by the openweather response
        this.id = openWeather.id;
        this.sensors = {};
        this.ts = ts;

        let temperature = new Sensor(openWeather.main.temp - KELVIN_CONVERSION, ts); // since openweather returns the temperature in kelvin, we translate it into celsius
        this.sensors["temperature"] = temperature;

        let humidity = new Sensor(openWeather.main.humidity, ts);
        this.sensors["humidity"] = humidity;

        let windIntensity = new Sensor(openWeather.wind.speed, ts);
        this.sensors["windintensity"] = windIntensity;

        let windDirection = new Sensor(openWeather.wind.deg, ts);
        this.sensors["winddir"] = windDirection;

        let rain = openWeather.rain;
        let rainHeight = new Sensor(rain!=null ? rain['3h'] : 0, ts);
        this.sensors["rain"] = rainHeight;
    }

    setSensorsFromRiot(temp, hum, windDir, windInt, rain){
        let ts = new Date().getTime(); 
        this.id = 111;
        this.sensors = {};
        this.ts = ts;

        let temperature = new Sensor(temp, ts); // since openweather returns the temperature in kelvin, we translate it into celsius
        this.sensors["temperature"] = temperature;

        let humidity = new Sensor(hum, ts);
        this.sensors["humidity"] = humidity;

        let windIntensity = new Sensor(windDir, ts);
        this.sensors["windintensity"] = windIntensity;

        let windDirection = new Sensor(windInt, ts);
        this.sensors["winddir"] = windDirection;

        let rainHeight = new Sensor(rain, ts);
        this.sensors["rain"] = rainHeight;
    }
}

module.exports = VirtualStation.bind(this);