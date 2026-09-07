function toAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}

export function calculatePurchaseTotals({
  membershipAmount = 0,
  personalTrainingAmount = 0,
  discount = 0,
  amountPaid = 0
} = {}) {
  const normalizedMembershipAmount = toAmount(membershipAmount);
  const normalizedPersonalTrainingAmount = toAmount(personalTrainingAmount);
  const subtotal = normalizedMembershipAmount + normalizedPersonalTrainingAmount;
  const normalizedDiscount = Math.min(toAmount(discount), subtotal);
  const totalAmount = subtotal - normalizedDiscount;
  const normalizedAmountPaid = toAmount(amountPaid);

  return {
    membershipAmount: normalizedMembershipAmount,
    personalTrainingAmount: normalizedPersonalTrainingAmount,
    subtotal,
    discount: normalizedDiscount,
    totalAmount,
    amountPaid: normalizedAmountPaid,
    pendingAmount: Math.max(totalAmount - normalizedAmountPaid, 0)
  };
}

export function calculateSubscriptionEndDate(startDate, duration, durationUnit) {
  if (!startDate || !Number.isFinite(Number(duration)) || Number(duration) <= 0) return '';

  const date = new Date(`${String(startDate).slice(0, 10)}T00:00:00Z`);
  const unit = String(durationUnit || '').toUpperCase();

  if (unit === 'MONTH' || unit === 'MONTHS') {
    date.setUTCMonth(date.getUTCMonth() + Number(duration));
  } else if (unit === 'YEAR' || unit === 'YEARS') {
    date.setUTCFullYear(date.getUTCFullYear() + Number(duration));
  } else {
    date.setUTCDate(date.getUTCDate() + Number(duration));
  }

  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function allocatePayment(amount, membershipOutstanding, personalTrainingOutstanding) {
  const paymentAmount = toAmount(amount);
  const membershipAmount = Math.min(paymentAmount, toAmount(membershipOutstanding));
  const personalTrainingAmount = Math.min(
    paymentAmount - membershipAmount,
    toAmount(personalTrainingOutstanding)
  );

  return { membershipAmount, personalTrainingAmount };
}