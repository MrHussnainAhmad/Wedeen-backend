import { Memorization } from '../models/Memorization.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/errors.js';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcStreak(days) {
  if (!days.length) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i += 1) {
    const prev = days[i - 1];
    const curr = days[i];
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  const today = startOfDay(new Date());
  const last = days[days.length - 1];
  const gapFromToday = (today - last) / (1000 * 60 * 60 * 24);
  const currentStreak = gapFromToday <= 1 ? current : 0;

  return { currentStreak, longestStreak: longest };
}

export const getMemorization = asyncHandler(async (req, res) => {
  const items = await Memorization.find({ userId: req.user.id })
    .sort({ surahNumber: 1, ayahNumber: 1 })
    .lean();
  res.json({ items });
});

export const markMemorization = asyncHandler(async (req, res) => {
  const { surahNumber, ayahNumber, memorized, nextReview } = req.body;
  const now = new Date();

  const update = {
    memorized,
    lastReviewed: now,
    nextReview: nextReview ? new Date(nextReview) : null
  };

  const item = await Memorization.findOneAndUpdate(
    { userId: req.user.id, surahNumber, ayahNumber },
    { $set: update, $setOnInsert: { userId: req.user.id, surahNumber, ayahNumber } },
    { upsert: true, new: true }
  ).lean();

  res.status(201).json({ item });
});

export const updateMemorization = asyncHandler(async (req, res) => {
  const { id, memorized, lastReviewed, nextReview } = req.body;
  if (!id) throw badRequest('id is required');

  const update = {};
  if (typeof memorized === 'boolean') update.memorized = memorized;
  if (lastReviewed) update.lastReviewed = new Date(lastReviewed);
  if (nextReview) update.nextReview = new Date(nextReview);

  const item = await Memorization.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { $set: update },
    { new: true }
  ).lean();

  if (!item) throw notFound('Memorization item not found');
  res.json({ item });
});

export const deleteMemorization = asyncHandler(async (req, res) => {
  const item = await Memorization.findOneAndDelete({ _id: req.params.id, userId: req.user.id }).lean();
  if (!item) throw notFound('Memorization item not found');
  res.json({ success: true });
});

export const getMemorizationStats = asyncHandler(async (req, res) => {
  const items = await Memorization.find({ userId: req.user.id, memorized: true })
    .select('surahNumber lastReviewed')
    .lean();

  const totalMemorizedAyahs = items.length;
  const uniqueSurahs = new Set(items.map((x) => x.surahNumber));
  const totalSurahsStarted = uniqueSurahs.size;
  const completionPercentage = Number(((totalMemorizedAyahs / 6236) * 100).toFixed(2));

  const reviewedDays = [...new Set(
    items
      .filter((x) => x.lastReviewed)
      .map((x) => startOfDay(x.lastReviewed).getTime())
  )]
    .sort((a, b) => a - b)
    .map((x) => new Date(x));

  const { currentStreak, longestStreak } = calcStreak(reviewedDays);

  res.json({
    totalMemorizedAyahs,
    totalSurahsStarted,
    completionPercentage,
    currentStreak,
    longestStreak
  });
});

export const getLearningProgress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('unlockedSurah').lean();
  if (!user) throw notFound('User not found');

  res.json({
    unlockedSurah: Math.max(1, Math.min(114, user.unlockedSurah || 1))
  });
});

export const unlockNextSurah = asyncHandler(async (req, res) => {
  const { surahNumber } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('User not found');

  const unlockedSurah = Math.max(1, Math.min(114, user.unlockedSurah || 1));
  if (surahNumber > unlockedSurah) {
    throw badRequest('This surah is still locked');
  }

  if (surahNumber === unlockedSurah && unlockedSurah < 114) {
    user.unlockedSurah = unlockedSurah + 1;
    await user.save();
  }

  res.json({
    unlockedSurah: Math.max(1, Math.min(114, user.unlockedSurah || 1))
  });
});
