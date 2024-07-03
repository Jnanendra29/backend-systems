const amqp = require('amqplib');
const mongoose = require('mongoose');
const Task = require('./models/Task'); // Make sure Task model is defined correctly
require('dotenv').config();

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

async function processTasks() {
  await connectToMongoDB();

  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();
    const queue = 'tasks'; // Replace with your queue name

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);
    console.log(`Worker is waiting for tasks in queue: ${queue}`);

    channel.consume(queue, async (msg) => {
      const taskContent = msg.content.toString();
      console.log(`Processing task: ${taskContent}`);

      try {
        const task = new Task({ content: taskContent });
        await task.save();
        console.log('Task saved to MongoDB');
      } catch (err) {
        console.error('Failed to save task to MongoDB', err);
      }

      channel.ack(msg);
    });
  } catch (err) {
    console.error('Failed to process tasks', err);
    process.exit(1);
  }
}

processTasks();
