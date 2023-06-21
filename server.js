// Node.js server (app.js)
const express = require('express');
const app = express();

const { Kafka } = require('kafkajs');


const express = require('express');
const { Server } = require('mysql2/typings/mysql/lib/Server');
const http = require('http').Server(app);
const io = require('socket.io')(http);

//socket
io.on('connection', (socket) => {
    console.log('New frontend user connected');

    // Send notification to the frontend user
    socket.emit('notification', 'Your request is being processed');

    socket.on('disconnect', () => {
        console.log('Frontend user disconnected');
    });
});



app.post('/request', (req, res) => {
    const requestData = req.body; // Assuming request data is in the request body
    // Store the request data in the Sequelize database
    // Use Sequelize model and save the data
    YourModel.create(requestData)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to store request data' });
        });
});


//send request to java//

const kafka = new Kafka({
    clientId: 'nodejs-client',
    brokers: ['kafka:9092'] // Replace with your Kafka broker configuration
});

const producer = kafka.producer();

async function sendRequestDataToJava(topic, requestData) {
    await producer.connect();
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(requestData) }]
    });
    await producer.disconnect();
}

// Call the function to send the request data to the Java consumer
const topic = 'requests-topic'; // Replace with your Kafka topic name
const requestData = { id: 123, data: 'Sample request data' };
sendRequestDataToJava(topic, requestData)
    .then(() => {
        console.log('Request data sent to Java consumer');
    })
    .catch((error) => {
        console.error('Failed to send request data:', error);
    });




//kafka response//

// Node.js server (app.js)
// ...

async function processResponseFromJava(topic, responseData) {
    // Retrieve the corresponding request data from the Sequelize database using the stored user ID
    const userId = responseData.userId; // Assuming user ID is stored in the response data
    const request = await YourModel.findOne({ where: { userId } });

    if (request && request.data === responseData.requestData) {
        // Send notification to the backend
        // Use your preferred method to send the notification
    }
}

// Subscribe to the Kafka topic and process the response data from Java
const consumer = kafka.consumer({ groupId: 'nodejs-consumer' });

async function consumeResponsesFromJava() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'responses-topic' }); // Replace with your Kafka topic name

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const responseData = JSON.parse(message.value.toString());

            if (topic === 'responses-topic') {
                await processResponseFromJava(topic, responseData);
            }
        }
    });
}

consumeResponsesFromJava()
    .then(() => {
        console.log('Node.js server subscribed to response messages');
    })
    .catch((error) => {
        console.error('Failed to subscribe to response messages:', error);
    });



//provide response to front-end//

// Node.js server (app.js)
// ...

app.get('/response/:userId', (req, res) => {
    const userId = req.params.userId;
    // Retrieve the response data from the Sequelize database using the user ID
    YourModel.findOne({ where: { userId } })
        .then((response) => {
            if (response) {
                res.status(200).json(response);
            } else {
                res.status(404).json({ error: 'Response not found' });
            }
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to retrieve response data' });
        });
});




Server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
