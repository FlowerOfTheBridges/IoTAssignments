# CrowdSensing Activity Recognition Model

The folder *crowdsensing* contains a *crowdsensing environment* that detects if a user is moving or standing still. The system is made by: 
* an *edge_based* solution where the activity recognition model is computed by the user which will send the resulting activity status to the cloud. This solution is made by:
  * a mobile web application which reads data from the sensors, computes the model and sends the resulting status to the cloud through a WebSocket. In particular:
    * the browser running the page must support the [*Generic Sensor API*](https://www.w3.org/TR/generic-sensor/) and the [*Permissions API*](https://w3c.github.io/permissions/),
    * cookie must be enabled to give the possibility to the application to store the session identifier.
  * a dashboard where the user can see informations about the current session, such as the various samples that has been stored and the corresponding status
* a *cloud_based* solution where the activity recognition model is computed by the cloud which will return the resulting activity status. This solution is made by:
  * a mobile web application which reads data from the accelerometer and sends its data to the cloud through a WebSocket. In particular:
    * the browser running the page must support the [*Generic Sensor API*](https://www.w3.org/TR/generic-sensor/) and the [*Permissions API*](https://w3c.github.io/permissions/),
    * cookie must be enabled to give the possibility to the application to store the session identifier.
  * a dashboard where the user can see informations about the current session, such as the various samples that has been stored and the corresponding status, along with the accelerometer information.
  
All those pages can be found on *GitHub pages* at the following links:
* [Edge Based Mobile Client](https://flowerofthebridges.github.io/IoTWeatherStation/crowdsensing/edge_based/)
* [Edge Based Mobile Dashboard](https://flowerofthebridges.github.io/IoTWeatherStation/crowdsensing/edge_based/dashboard)
* [Cloud Based Mobile Client](https://flowerofthebridges.github.io/IoTWeatherStation/crowdsensing/cloud_based)
* [Cloud Based Mobile Dashboard](https://flowerofthebridges.github.io/IoTWeatherStation/crowdsensing/cloud_based/dashboard)

### About the model
The activity recognition model computes the [*Signal Magnitude Area* (*SMA*)](https://en.wikipedia.org/wiki/Signal_magnitude_area). If the *SMA* is below a given threshold of 1.5, it means that the user is standing still, otherwise is moving.
### About the cloud
The cloud runs a *serverless architecture* by the usage of *API Gateway* and *Lambda*. The *API Gateway* runs a *WS Endpoint* with two routes:
* *store*: saves the samples inside a *DynamoDB* table.
* *getsamples*: retrieves all the samples from *DynamoDB*  or only the ones within the last hour.
The corresponding *lambda functions* can be found on the *aws_lambda* folder.  
### Last remarks
A more hands-on tutorial on how to setup the RIOT-OS application and the gateway can be found [on my LinkedIn profile](https://www.linkedin.com/pulse/develop-serverless-activity-recognition-model-using-aws-fiordeponti/).

