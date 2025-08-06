const supabase = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Direct Stripe import
const config = require('../config/environment');

// Validate currency and amount
const validCurrencies = ['mxn', 'usd'];
const validateAmount = (amount) => Number(amount) > 0 && Number.isInteger(Number(amount) * 100);

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'mxn', class_id } = req.body;
    const user_id = req.user.id;

    // Input validation
    if (!amount || !validateAmount(amount)) {
      return res.status(400).json({ error: 'Amount must be a positive integer in cents' });
    }
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return res.status(400).json({ error: `Currency must be one of: ${validCurrencies.join(', ')}` });
    }
    if (!class_id) return res.status(400).json({ error: 'Class ID is required' });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: await stripe.customers.create({ email: req.user.email }), // Link to user
      metadata: { user_id, class_id },
    });

    // Optionally link to Booking (if created)
    const { data: booking, error: bookingError } = await supabase
      .from('Bookings')
      .insert({ user_id, class_id, type: 'one-time', payment_status: 'pending' })
      .select()
      .single();
    if (bookingError) return next(bookingError);

    res.status(200).json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret, bookingId: booking.id },
    });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const customer = await stripe.customers.list({ email: req.user.email });
    const methods = await stripe.paymentMethods.list({
      customer: customer.data[0]?.id,
      type: 'card',
    });

    res.status(200).json({ success: true, data: methods.data });
  } catch (err) {
    next(err);
  }
};

exports.addPaymentMethod = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { paymentMethodId } = req.body;
    if (!user_id || !paymentMethodId) {
      return res.status(400).json({ error: 'User ID and payment method ID are required' });
    }

    const customer = await stripe.customers.list({ email: req.user.email });
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.data[0]?.id,
    });
    await stripe.customers.update(customer.data[0]?.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.status(200).json({ success: true, data: { paymentMethodId } });
  } catch (err) {
    next(err);
  }
};

exports.removePaymentMethod = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    if (!user_id || !id) {
      return res.status(400).json({ error: 'User ID and payment method ID are required' });
    }

    const customer = await stripe.customers.list({ email: req.user.email });
    await stripe.paymentMethods.detach(id);

    res.status(200).json({ success: true, message: 'Payment method removed' });
  } catch (err) {
    next(err);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ error: 'Missing Stripe signature' });

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Use .env directly
    );

    if (event.type === 'payment_intent.succeeded') {
      const { metadata } = event.data.object;
      const { user_id, class_id } = metadata;
      await supabase
        .from('Bookings')
        .update({ payment_status: 'completed' })
        .eq('user_id', user_id)
        .eq('class_id', class_id)
        .eq('payment_status', 'pending');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};