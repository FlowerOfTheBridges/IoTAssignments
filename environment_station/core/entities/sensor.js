class Sensor {
    /**
     * Class that represents the sensor of a virtual station
     * @param {number} value measure of the sensor
     * @param {number} timestamp unix-like format
     */  
    constructor(value, timestamp){
        this.value = value;
        this.ts = timestamp;
    }
}

module.exports = Sensor.bind(this);