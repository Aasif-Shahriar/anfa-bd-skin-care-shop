import { Review } from '../types';

export const INITIAL_SAMPLE_REVIEWS: Record<string, Review[]> = {
  // Default fallback reviews for products that don't have custom ones yet
  default: [
    {
      id: 'rev_sample_default_1',
      productId: 'all',
      productName: 'Korean Skincare Formula',
      userId: 'usr_skincare_lover_1',
      userName: 'Tasnim Ahmed',
      userEmail: 'tasnim.a@example.com',
      rating: 5,
      title: 'Amazing results for acne and glass-skin glow!',
      comment:
        'I have combination, sensitive skin and was skeptical at first, but after just one week of daily use my redness has reduced noticeably. It absorbs smoothly without any greasy residue or heavy fragrance. 100% authentic Korean product, verified by the batch code on the box.',
      verifiedPurchase: true,
      variationChosen: 'Standard Size',
      createdAt: '2026-09-20T14:32:00.000Z',
    },
    {
      id: 'rev_sample_default_2',
      productId: 'all',
      productName: 'Korean Skincare Formula',
      userId: 'usr_skincare_lover_2',
      userName: 'Nadia Rahman',
      userEmail: 'nadia.r@example.com',
      rating: 5,
      title: 'Gentle, soothing, and zero breakout triggers',
      comment:
        'Ordered to Dhaka and arrived securely sealed with bubble wrap in 36 hours. The texture feels luxurious and soothing on the skin. Kept my moisture barrier protected throughout hot and humid weather without clogging pores. Will definitely repurchase from ANFA BD!',
      verifiedPurchase: true,
      variationChosen: 'Standard Size',
      createdAt: '2026-09-29T09:15:00.000Z',
    },
    {
      id: 'rev_sample_default_3',
      productId: 'all',
      productName: 'Korean Skincare Formula',
      userId: 'usr_skincare_lover_3',
      userName: 'Farzana Karim',
      userEmail: 'farzana.k@example.com',
      rating: 4,
      title: 'Deeply hydrating and very gentle formula',
      comment:
        'High quality ingredients that do not sting or cause any irritation around the eyes. Gives a healthy dewy finish and layers perfectly under daily sunscreen and makeup. Highly recommended for girls looking for clean, authentic Korean formulas.',
      verifiedPurchase: true,
      variationChosen: 'Value Pack',
      createdAt: '2026-10-02T11:45:00.000Z',
    },
  ],
};
