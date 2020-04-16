/**
 * wrapper for the config.json file in the resource folder.
 */
class TTNConfiguration {
    /**
     * 
     * @param {string} appKey 
     * @param {string} appAccessKey 
     */
    constructor(appKey, appAccessKey) {
        this.appKey = appKey;
        this.appAccessKey = appAccessKey;
    }
}

module.exports = TTNConfiguration.bind(this);