# IoTWeatherStation

<img src="http://www.dis.uniroma1.it/sites/default/files/marchio%20logo%20eng%20jpg.jpg">

## Description
This repository contains various material for the assignments made during Internet of Things course held at La Sapienza University of Rome.

## First assignment
We need to develop a weather cloud platform, where:

* A *station* (at least one) retrieves values (such as temperature, humidity...) from different sensors, and publish its state in a topic provided by an* MQTT Broker*, hosted by the *Cloud Platform*.
* The *MQTT broker* triggers a procedure which stores the data in a record that will be inserted in a NoSql database.
* A *web application* receives the data in order to show them to the final user.

This platform has been developed using the tools provided by the [AWS Platform](https://console.aws.amazon.com), such as IoTCore, DynamoDB and ElasticBeanstalk. 
here the main parts of the infrastructure , such as the client and the web application, are developed using the javascript programming language, upon the Node.js runtime. In particular:

* the station is a CLI application, located in the environment_station that can be launched by using the following command. The values from the sensors are retrieved by calling the [OpenWeather API](https://openweathermap.org/api) and published through the topic provided in the configuration file. Then, we can launch many instances of it by typing
```
node .\env_station.js *name of the city* *country code of the city* 
```
* the web application, located in the server folder, must be filled with the *.ebestension* folder in order to be deployed on *Elastic Beanstalk*.

### Instructions
After downloading the repository
```
git clone https://github.com/FlowerOfTheBridges/IoTWeatherStation
```
install the following dependencies using a packet manager of your choice (such as npm):

```
npm install axios
```
in order to call the weather API. Then
```
npm install aws-iot-device-sdk
```
in order to use the *MQTTClient* class, then
```
npm install aws-sdk
```
in order to retrieve data from *DynamoDB*. Last
```
npm install express
npm install body-parser
```
to run the server.
### Last remarks
More insights on how to setup the AWS infrastructure can be found at the [following article published on LinkedIn](https://www.linkedin.com/pulse/first-approach-iot-virtual-enviromental-station-aws-core-fiordeponti).
Also, a demonstration of how the system works can be found in the video below.


<a href="http://www.youtube.com/watch?feature=player_embedded&v=HBU_OFe8jx4&t=22s
" target="_blank"><img src="http://img.youtube.com/vi/HBU_OFe8jx4&t=22s/0.jpg" 
alt="Demonstration" width="240" height="180" border="10" /></a>

## Second Assignment
The weather station now must be deployed in a real microcontroller, so two new components were introduced:
* *riotos_app*: is a [RIOT-OS](https://www.linkedin.com/pulse/first-approach-iot-virtual-enviromental-station-aws-core-fiordeponti) application were random values are published to a default topic of a MQTT-SN Broker (such as [MOSQUITTO.RSMB](https://github.com/eclipse/mosquitto.rsmb)) through a MQTT-SN connection. The command that needs to be prompted in the application shell to run the measurement process is 
```
run <identifier> <ipv6 address of the broker> <port we're the broker is listening>
```
* *mqttsn_gateway*: is a transparent gateway that translates the MQTT-SN messages of the *RIOT-OS app* in MQTT messages that will be send to *AWS IoT Core platform*. In particular it relies on the core package that was also used on the previous assignment. In particular, this package has the following updates:
  - MQTTClient constructor now needs to have two parameters: *broker* and *config*. While config remains the same as before, *broker* is a string that tells the type of broker we are going to use (it can be one of *AWS* or *MOSQUITTO*, were the latter must be local on port 1886). So in the main procedure main.js we need to create two connections by the usage of the following instructions:
   ```javascript
   this.localClient = new MqttClient('MOSQUITTO', null);
   this.awsClient = new MqttClient('AWS', this.config);
   ```
  - VirtualStation class now has a new method, *setSensorsFromRiot*, that parses a message of the form 
  ```
  <temp>|<hum>|<wind_dir>|<wind_int>|<rain>|<id>
  ```
A more hands-on tutorial on how to setup the RIOT application and the broker can be found [on my LinkedIn profile](https://www.linkedin.com/pulse/another-step-through-iot-field-programming-things-fiordeponti/).
