#!/usr/bin/env node
 
// system deps
var sys = require('sys');
var http = require('http');
var format = require('util').format;
var qs = require('querystring');

// userland dependenciess
var MongoClient = require('mongodb').MongoClient;
var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');


// setup AWS and SQS
AWS.config.loadFromPath(__dirname+'/../config.json');
var sqs = new AWS.SQS();

// get the Queue URL and start handlers
console.log('Getting Queue URL...');
sqs.getQueueUrl({QueueName: ''}, function(err, data) {
    if (err) {
        console.log(err, err.stack);
        return;
    }
    
    if (data.QueueUrl) {
        console.log('Got Queue URL: '+data.QueueUrl);
        console.log('Starting HTTP server...');
        startHttpServer(data.QueueUrl);
        
        console.log('Starting Queue handler...');
        processing = setInterval(function(){
            processQueue(data.QueueUrl);
        }, 5000);
    }
});

function processQueue(url) {
    console.log('Checking Queue...');
    sqs.receiveMessage({QueueUrl:url}, function(err, data){
        if (data.Messages) {
            // save data to the db
            MongoClient.connect('mongodb://127.0.0.1:27017/exceptions', function(err, db) {
                if (err) throw err;
                
                var collection = db.collection('cre');
                data.Messages.forEach(function(item) {
                    try {
                        var data = JSON.parse(item.Body);
                        
                        console.log('Saving data to mongo...');
                        collection.insert(data, function(err, docs) {
                            console.log(docs);
                        });
                    } catch (e) {
                        // swallow the error for now...
                        console.log(e);
                    }
                });
            });
            
            console.log('Got a message from the Queue!');
            // then delete them (need to convert into params object first)
            var toDelete = [];
            data.Messages.forEach(function(item) {
                toDelete.push( { Id: item.MessageId, ReceiptHandle: item.ReceiptHandle} );
            });
            
            console.log('Deleting message from Queue...');
            
            sqs.deleteMessageBatch({ QueueUrl: url, Entries: toDelete }, function(err, data) {
                console.log(err); console.log(data);
            });
        }
    });
}

function startHttpServer(qUrl) {
    var app = express();
    
    app.use(bodyParser());
    
    app.post('/', function(req, res) {
        var exception = JSON.stringify(req.body);
        
        sqs.sendMessage({ QueueUrl: qUrl, MessageBody: exception }, function(err, data) {
            if (err) {
                console.log(err);
            }
        });
        
        res.send('{"success": true}');
    });
    
    app.listen(4444);
}
