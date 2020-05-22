console.log('function starts');
const Model = require('./model');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

exports.handler = function(event, context, callback){
    console.log('processing event: %j', event);
    let message = JSON.parse(event.body).message;
    
    console.log('processing message: %s', message);
    
    let model = new Model();
    let sma = message.isCloudBased ? model.sma(message.measures) : null;
    let status = message.isCloudBased ? model.getStatus(sma) : message.status;
    
    var params = {
            TableName: "crowd_sensing",
            Item:{
                "ts": message.ts,
                "id": message.id ,
                "info": message.isCloudBased ? {
                    "measures": message.measures,
                    "sma": sma,
                    "status": status
                } : {"status" : status}
            }
        };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item to crowd_sensing. Error JSON:", JSON.stringify(err, null, 2));
            callback(null, {"statusCode": 200, "body": JSON.stringify(err)});
        } 
        else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            if(message.isCloudBased){
                callback(null,{"statusCode": 200, "body": status});
            }
        }
    });
};
