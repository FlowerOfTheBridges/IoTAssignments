console.log('function starts');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

var latestParams = {
    TableName: "crowd_sensing"
};

var lastHourParams = {
    TableName: "crowd_sensing",
    FilterExpression: "#ts between :ts1 and :ts2 ",
    ExpressionAttributeNames:{
        "#ts": "ts"
    },
    ExpressionAttributeValues: {
        ":ts1": new Date().setHours(new Date().getHours()-1),
        ":ts2": Date.now()
    }
};


exports.handler = function(event, context, callback){
    console.log('processing event: %j', event);
    let message = JSON.parse(event.body).message;
    
    console.log('processing message: %s', event);
    let params = message.lastHour==true ? lastHourParams : latestParams;
    
    if(message.id){
        if(!params.FilterExpression && !params.ExpressionAttributeNames && !params.ExpressionAttributeValues){
            params['FilterExpression'] = "";
            params['ExpressionAttributeNames'] = {};
            params['ExpressionAttributeValues'] = {};
        }
        
        params['FilterExpression'] = "#id = :uuid"+(params['FilterExpression']!="" ? " and " : "")+params['FilterExpression'];
        params.ExpressionAttributeNames["#id"] = "id";
        params.ExpressionAttributeValues[":uuid"] = message.id;
    }
    
    console.log("Scanning Ddb with parameters: %o", params);
    
    docClient.scan(params, function(err, data) {
        let crowd = {};       
        if (err) {
            console.error("error: %s", err);
            callback(null, {"statusCode": 500, "body": "Internal error."});
        } 
        else {
            data && data.Items && data.Items.forEach(function(item){
                if(!crowd[item.id]){
                    crowd[item.id] = [];
                }
                
                crowd[item.id] && crowd[item.id].push({
                    'ts': item.ts,
                    'measures': item.info.measures || null,
                    'sma': item.info.sma || null,
                    'status': item.info.status || null
                });
            });
            
            callback(null, {"statusCode": 200, "body": JSON.stringify(crowd)});
        }
    });
};
    
