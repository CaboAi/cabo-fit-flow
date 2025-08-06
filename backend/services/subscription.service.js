const stripe = require('../config/stripe');
const supabase = require('../config/database');

exports.getSubscription = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'active',
    limit: 1
  });

  return subscriptions.data[0] || null;
};

exports.createSubscription = async (userId, priceId, paymentMethodId) => {
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

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent']
  });

  return subscription;
};

exports.cancelSubscription = async (userId) => {
  const subscription = await this.getSubscription(userId);
  if (!subscription) throw new Error('No active subscription found');

  const canceled = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true
  });

  return canceled;
};

exports.updateSubscription = async (userId, newPriceId) => {
  const subscription = await this.getSubscription(userId);
  if (!subscription) throw new Error('No active subscription found');

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId
    }]
  });

  return updated;
};

exports.getAvailablePlans = async () => {
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product']
  });

  return prices.data;
};