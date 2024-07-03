const express = require('express');
const amqp = require('amqplib');
const router = express.Router();

router.post('/enqueue', async (req, res) => {
  const { user } = req;
  const { task } = req.body;

  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();

    channel.assertQueue(user, { durable: true });
    channel.sendToQueue(user, Buffer.from(task));

    res.json({ message: 'Task enqueued successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to enqueue task' });
  }
});

module.exports = router;
