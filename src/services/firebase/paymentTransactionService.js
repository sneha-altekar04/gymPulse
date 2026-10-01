import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import { PAYMENT_STATUS } from '../../constants/domain';

function money(value) {
  return Math.max(Number(value || 0), 0);
}

function paymentStatus(total, paid) {
  if (paid >= total) return PAYMENT_STATUS.PAID;
  if (paid > 0) return PAYMENT_STATUS.PARTIAL;
  return PAYMENT_STATUS.PENDING;
}

function receiptNumber(year, sequence) {
  return `GYM-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Atomically applies a payment to the membership and its open PT subscriptions,
 * advances the gym receipt sequence, and creates the immutable payment record.
 */
export async function recordPaymentTransaction({ gymId, payload, subscriptionIds = [], userId, minimumSequence = 0 }) {
  if (!gymId) throw new Error('Gym context is required to record a payment.');

  const amount = money(payload.amount);
  if (!amount) throw new Error('Payment amount must be greater than zero.');

  const membershipRef = doc(db, `gyms/${gymId}/memberships/${payload.membershipId}`);
  const counterRef = doc(db, `gyms/${gymId}/counters/receipts`);
  const paymentRef = doc(collection(db, `gyms/${gymId}/payments`));
  const subscriptionRefs = [...new Set(subscriptionIds)].map((id) => ({
    id,
    ref: doc(db, `gyms/${gymId}/personalTrainingSubscriptions/${id}`)
  }));

  return runTransaction(db, async (transaction) => {
    const [membershipSnapshot, counterSnapshot, ...subscriptionSnapshots] = await Promise.all([
      transaction.get(membershipRef),
      transaction.get(counterRef),
      ...subscriptionRefs.map(({ ref }) => transaction.get(ref))
    ]);

    if (!membershipSnapshot.exists()) throw new Error('Membership not found. Refresh and try again.');

    const membership = membershipSnapshot.data();
    if (membership.memberId !== payload.memberId) throw new Error('The selected membership does not belong to this member.');

    const membershipCharge = money(membership.membershipAmount ?? membership.finalAmount);
    const existingMembershipPaid = money(membership.membershipAmountPaid ?? membership.amountPaid);
    const membershipOutstanding = Math.max(membershipCharge - existingMembershipPaid, 0);

    const subscriptions = subscriptionSnapshots
      .map((snapshot, index) => ({ id: subscriptionRefs[index].id, snapshot }))
      .filter(({ snapshot }) => snapshot.exists())
      .map(({ id, snapshot }) => ({ id, data: snapshot.data(), ref: snapshot.ref }))
      .filter(({ data }) => data.memberId === payload.memberId)
      .map((subscription) => ({
        ...subscription,
        outstanding: Math.max(money(subscription.data.amount) - money(subscription.data.amountPaid), 0)
      }))
      .filter(({ outstanding }) => outstanding > 0);

    const personalTrainingOutstanding = subscriptions.reduce((sum, item) => sum + item.outstanding, 0);
    const totalOutstanding = membershipOutstanding + personalTrainingOutstanding;
    if (amount > totalOutstanding) throw new Error('Payment amount cannot exceed the outstanding balance.');

    const membershipApplied = Math.min(amount, membershipOutstanding);
    let remaining = amount - membershipApplied;
    const subscriptionUpdates = [];

    for (const subscription of subscriptions) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, subscription.outstanding);
      const amountPaid = money(subscription.data.amountPaid) + applied;
      subscriptionUpdates.push({ id: subscription.id, amountPaid, applied });
      remaining -= applied;
    }

    if (remaining > 0) throw new Error('Some of the payment could not be allocated. Refresh and try again.');

    const previousTotalPaid = money(membership.amountPaid);
    const newTotalPaid = previousTotalPaid + amount;
    const newMembershipPaid = existingMembershipPaid + membershipApplied;
    const totalCharge = money(membership.totalAmount ?? membership.finalAmount ?? membershipCharge + personalTrainingOutstanding);
    const membershipUpdate = {
      amountPaid: newTotalPaid,
      membershipAmountPaid: newMembershipPaid,
      pendingAmount: Math.max(totalCharge - newTotalPaid, 0),
      updatedAt: serverTimestamp()
    };

    const year = new Date().getFullYear();
    const counter = counterSnapshot.exists() ? counterSnapshot.data() : {};
    const storedSequence = counter.year === year ? Number(counter.sequence || 0) : 0;
    const sequence = Math.max(storedSequence, Number(minimumSequence || 0)) + 1;
    const generatedReceiptNumber = receiptNumber(year, sequence);
    const personalTrainingApplied = amount - membershipApplied;
    const paymentData = {
      gymId,
      memberId: payload.memberId,
      membershipId: payload.membershipId,
      receiptNumber: generatedReceiptNumber,
      membershipAmount: membershipApplied,
      personalTrainingAmount: personalTrainingApplied,
      amount,
      paymentMode: payload.paymentMode,
      status: paymentStatus(totalCharge, newTotalPaid),
      paymentDate: payload.paymentDate,
      notes: payload.notes || '',
      createdBy: userId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.update(membershipRef, membershipUpdate);
    subscriptionUpdates.forEach((update) => {
      const subscription = subscriptions.find((item) => item.id === update.id);
      transaction.update(subscription.ref, {
        gymId,
        amountPaid: update.amountPaid,
        updatedBy: userId || null,
        updatedAt: serverTimestamp()
      });
    });
    transaction.set(counterRef, { year, sequence, updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(paymentRef, paymentData);

    return {
      payment: { id: paymentRef.id, ...paymentData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      membershipUpdate: { ...membershipUpdate, updatedAt: new Date().toISOString() },
      subscriptionUpdates
    };
  });
}
