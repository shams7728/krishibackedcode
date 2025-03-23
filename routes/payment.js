const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

// Stripe payment gateway
const stripe = require('stripe')(process.env.STRIPE_SKRT_KET_TST);

module.exports = (io) => {

// Stripe Payment API
router.post('/stripe', asyncHandler(async (req, res) => {
  try {
    console.log('Stripe Payment Initiated');
    const { email, name, address, amount, currency, description } = req.body;

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      address: address,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer.id,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Emit WebSocket event for payment initiation
    io.emit('paymentUpdate', { action: 'initiated', data: { email, amount, currency } });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PBLK_KET_TST,
    });

  } catch (error) {
    console.log(error);
    io.emit('paymentUpdate', { action: 'failed', data: { error: error.message } });
    return res.json({ error: true, message: error.message, data: null });
  }
}));

// Razorpay Payment API
router.post('/razorpay', asyncHandler(async (req, res) => {
  try {
    console.log('Razorpay Payment Initiated');
    const razorpayKey = process.env.RAZORPAY_KEY_TEST;

    // Emit WebSocket event for Razorpay payment initiation
    io.emit('paymentUpdate', { action: 'initiated', data: { provider: 'Razorpay' } });

    res.json({ key: razorpayKey });

  } catch (error) {
    console.log(error.message);
    io.emit('paymentUpdate', { action: 'failed', data: { error: error.message } });
    res.status(500).json({ error: true, message: error.message, data: null });
  }
}));

return router;
};
