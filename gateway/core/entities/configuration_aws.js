/**
 * wrapper for the config.json file in the resource folder.
 */
class AWSConfiguration {
    /**
     * 
     * @param {string} keyPath relative path of aws iot device private key
     * @param {string} certPath relative path of aws iot device certification key
     * @param {string} caPath relative path of aws certification key
     * @param {string} clientId name of the client
     * @param {string} host name of the aws iot endpoint
     * @param {string} token token of the openweather api. sign up at https://openweathermap.org/api 
     */
    constructor(keyPath, certPath, caPath, clientId, host, token) {
        this.keyPath = keyPath;
        this.certPath = certPath;
        this.caPath = caPath;
        this.clientId = clientId;
        this.host = host;
        this.token = token;
    }
}

module.exports = AWSConfiguration.bind(this);