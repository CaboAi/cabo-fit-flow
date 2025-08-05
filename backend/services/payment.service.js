const stripe = require('../config/stripe');
const supabase = require('../config/database');

exports.createPaymentIntent = async (userId, amount, currency = 'usd') => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: profile?.stripe_customer_id,
    metadata: { user_id: userId }
  });

  return intent;
};

exports.getPaymentMethods = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) return [];

  const methods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card'
  });

  return methods.data;
};

exports.addPaymentMethod = async (userId, paymentMethodId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { user_id: userId }
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });

  return paymentMethod;
};

exports.removePaymentMethod = async (userId, paymentMethodId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error('No customer found');
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  
  if (paymentMethod.customer !== profile.stripe_customer_id) {
    throw new Error('Payment method does not belong to this customer');
  }

  await stripe.paymentMethods.detach(paymentMethodId);
};

exports.handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object);
      break;
    case 'payment_intent.failed':
      console.log('Payment failed:', event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log('Subscription event:', event.type, event.data.object);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
};