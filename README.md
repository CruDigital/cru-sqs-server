# CRE Queue IO Processor

Written in Node.js, a simple async server that takes a post to put something 
into our SQS system. Currently it is logging exceptions and is hard-coded to 
use a particular SQS url, though this can be changed fairly easily. 

It is hard coded to run a webserver listening for POSTs on port 4444. To use 
this, you'll need to copy ````config.json.example```` to ````config.json```` 
and replace the items with your credentials.

## Installation

1. Clone the repository to where you want to run the server
2. Run ````npm install```` in the base directory to install dependencies
3. Copy ````config.json.example```` to ````config.json```` and change values
4. Open ````src/main.js```` and change MongoDB and SQS services to yours
5. Run ````node src/main.js````

## Usage

1. Send a POST to ````http://hostname:4444/```` with the POST data being what 
   you'd like to save to SQS
2. The Queue will be automatically processed, but you can change what you'd 
   like to be done with the messages in the ````main.js```` file.
   