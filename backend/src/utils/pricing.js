export const calculateDiscountedPrice = (basePrice, discountType, discountValue) => {
  const price = Number(basePrice);
  const value = Number(discountValue);

  if (!Number.isFinite(price) || !Number.isFinite(value)) {
    return 0;
  }

  const discountedPrice = discountType === 'PERCENTAGE'
    ? price - (price * value) / 100
    : price - value;

  return Math.max(0, Math.round(discountedPrice * 100) / 100);
};

export const isOfferCurrentlyActive = (offer, now = new Date()) => (
  offer.isActive === true
  && new Date(offer.startDate) <= now
  && new Date(offer.endDate) >= now
);
