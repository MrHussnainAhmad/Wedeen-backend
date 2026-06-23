import { SalahLog } from '../models/SalahLog.js';
import { Tasbih } from '../models/Tasbih.js';
import { Achievement } from '../models/Achievement.js';
import { Favorite } from '../models/Favorite.js';
import { ZakatCalculation } from '../models/ZakatCalculation.js';
import { FastingLog } from '../models/FastingLog.js';
import { PlaceFavorite } from '../models/PlaceFavorite.js';
import { DuaProgress } from '../models/DuaProgress.js';

// --- Salah Logs Sync ---
export async function syncSalah(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;

    for (const item of items) {
      const { date, prayerName, status, prayedAt } = item;
      const parsedPrayedAt = prayedAt ? new Date(prayedAt) : null;

      const existing = await SalahLog.findOne({ userId, date, prayerName });
      if (existing) {
        // If server is 'prayed', keep it. Otherwise overwrite.
        if (existing.status !== 'prayed' || status === 'prayed') {
          existing.status = status;
          if (parsedPrayedAt) {
            existing.prayedAt = parsedPrayedAt;
          }
          await existing.save();
        }
      } else {
        await SalahLog.create({
          userId,
          date,
          prayerName,
          status,
          prayedAt: parsedPrayedAt
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getSalah(req, res, next) {
  try {
    const userId = req.user.id;
    const logs = await SalahLog.find({ userId });
    
    // Map response to match frontend expectation
    const items = logs.map(l => ({
      date: l.date,
      prayerName: l.prayerName,
      status: l.status,
      prayedAt: l.prayedAt ? l.prayedAt.getTime() : undefined
    }));

    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
}

// --- Tasbih Sync ---
export async function syncTasbih(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;

    for (const item of items) {
      const { date, count } = item;
      const existing = await Tasbih.findOne({ userId, date });
      if (existing) {
        existing.count = Math.max(existing.count, count);
        await existing.save();
      } else {
        await Tasbih.create({ userId, date, count });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getTasbih(req, res, next) {
  try {
    const userId = req.user.id;
    const list = await Tasbih.find({ userId });
    
    const items = list.map(t => ({
      date: t.date,
      count: t.count
    }));

    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
}

// --- Achievements Sync ---
export async function syncAchievements(req, res, next) {
  try {
    const { achievementId, currentValue, isUnlocked, unlockedAt } = req.body;
    if (!achievementId) {
      return res.status(400).json({ message: 'achievementId is required' });
    }

    const userId = req.user.id;
    const parsedUnlockedAt = unlockedAt ? new Date(unlockedAt) : null;

    const existing = await Achievement.findOne({ userId, achievementId });
    if (existing) {
      existing.currentValue = Math.max(existing.currentValue, currentValue || 0);
      existing.isUnlocked = existing.isUnlocked || !!isUnlocked;
      if (parsedUnlockedAt) {
        if (!existing.unlockedAt || parsedUnlockedAt < existing.unlockedAt) {
          existing.unlockedAt = parsedUnlockedAt;
        }
      }
      await existing.save();
    } else {
      await Achievement.create({
        userId,
        achievementId,
        currentValue: currentValue || 0,
        isUnlocked: !!isUnlocked,
        unlockedAt: parsedUnlockedAt
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getAchievements(req, res, next) {
  try {
    const userId = req.user.id;
    const list = await Achievement.find({ userId });
    
    const achievements = list.map(a => ({
      achievementId: a.achievementId,
      currentValue: a.currentValue,
      isUnlocked: a.isUnlocked,
      unlockedAt: a.unlockedAt ? a.unlockedAt.getTime() : null
    }));

    return res.status(200).json({ achievements });
  } catch (err) {
    next(err);
  }
}

// --- Favorites Sync ---
export async function syncFavorites(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;

    for (const item of items) {
      const { surahNumber, surahNameEnglish, surahNameArabic, ayahNumber, arabicText, savedAt } = item;
      const parsedSavedAt = savedAt ? new Date(savedAt) : new Date();

      await Favorite.updateOne(
        { userId, surahNumber, ayahNumber },
        { 
          $setOnInsert: { 
            surahNameEnglish, 
            surahNameArabic, 
            arabicText, 
            savedAt: parsedSavedAt 
          } 
        },
        { upsert: true }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    const list = await Favorite.find({ userId }).sort({ savedAt: -1 });

    const items = list.map(f => ({
      surahNumber: f.surahNumber,
      surahNameEnglish: f.surahNameEnglish,
      surahNameArabic: f.surahNameArabic,
      ayahNumber: f.ayahNumber,
      arabicText: f.arabicText,
      savedAt: f.savedAt.getTime()
    }));

    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
}

// --- Zakat Calculation Sync ---
export async function syncZakat(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;
    for (const item of items) {
      if (!item?.calculationId) continue;
      await ZakatCalculation.updateOne(
        { userId, calculationId: item.calculationId },
        {
          $set: {
            currency: item.currency || 'USD',
            cashSavings: Number(item.cashSavings) || 0,
            goldValue: Number(item.goldValue) || 0,
            silverValue: Number(item.silverValue) || 0,
            investments: Number(item.investments) || 0,
            businessAssets: Number(item.businessAssets) || 0,
            liabilities: Number(item.liabilities) || 0,
            nisabThreshold: Number(item.nisabThreshold) || 0,
            zakatableTotal: Number(item.zakatableTotal) || 0,
            zakatDue: Number(item.zakatDue) || 0,
            createdAtClient: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
        },
        { upsert: true }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getZakat(req, res, next) {
  try {
    const items = await ZakatCalculation.find({ userId: req.user.id })
      .sort({ createdAtClient: -1 })
      .lean();
    return res.json({
      items: items.map((item) => ({
        calculationId: item.calculationId,
        currency: item.currency,
        cashSavings: item.cashSavings,
        goldValue: item.goldValue,
        silverValue: item.silverValue,
        investments: item.investments,
        businessAssets: item.businessAssets,
        liabilities: item.liabilities,
        nisabThreshold: item.nisabThreshold,
        zakatableTotal: item.zakatableTotal,
        zakatDue: item.zakatDue,
        createdAt: item.createdAtClient?.getTime?.() ?? Date.now(),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// --- Ramadan / Fasting Sync ---
export async function syncFasting(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;
    for (const item of items) {
      if (!item?.date) continue;
      await FastingLog.updateOne(
        { userId, date: item.date },
        {
          $set: {
            status: ['completed', 'missed', 'pending'].includes(item.status)
              ? item.status
              : 'pending',
            taraweehRakats: Math.max(0, Number(item.taraweehRakats) || 0),
            suhoorAt: item.suhoorAt ? new Date(item.suhoorAt) : null,
            iftarAt: item.iftarAt ? new Date(item.iftarAt) : null,
            notes: typeof item.notes === 'string' ? item.notes.slice(0, 500) : '',
          },
        },
        { upsert: true }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getFasting(req, res, next) {
  try {
    const items = await FastingLog.find({ userId: req.user.id }).sort({ date: -1 }).lean();
    return res.json({
      items: items.map((item) => ({
        date: item.date,
        status: item.status,
        taraweehRakats: item.taraweehRakats,
        suhoorAt: item.suhoorAt?.getTime?.() ?? null,
        iftarAt: item.iftarAt?.getTime?.() ?? null,
        notes: item.notes,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// --- Place Favorites Sync ---
export async function syncPlaceFavorites(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;
    for (const item of items) {
      if (!item?.placeId || !item?.name) continue;
      await PlaceFavorite.updateOne(
        { userId, placeId: item.placeId },
        {
          $set: {
            name: item.name,
            type: ['mosque', 'restaurant', 'prayer_space'].includes(item.type)
              ? item.type
              : 'restaurant',
            latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
            longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
            address: typeof item.address === 'string' ? item.address : '',
            rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : null,
            hasPrayerSpace: !!item.hasPrayerSpace,
            halalCertified: !!item.halalCertified,
            savedAt: item.savedAt ? new Date(item.savedAt) : new Date(),
          },
        },
        { upsert: true }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getPlaceFavorites(req, res, next) {
  try {
    const items = await PlaceFavorite.find({ userId: req.user.id }).sort({ savedAt: -1 }).lean();
    return res.json({
      items: items.map((item) => ({
        placeId: item.placeId,
        name: item.name,
        type: item.type,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        rating: item.rating,
        hasPrayerSpace: item.hasPrayerSpace,
        halalCertified: item.halalCertified,
        savedAt: item.savedAt?.getTime?.() ?? Date.now(),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// --- Dua Progress Sync ---
export async function syncDuas(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' });
    }

    const userId = req.user.id;
    for (const item of items) {
      if (!item?.duaId) continue;
      const existing = await DuaProgress.findOne({ userId, duaId: item.duaId });
      if (existing) {
        existing.categoryId = item.categoryId || existing.categoryId || '';
        existing.readCount = Math.max(existing.readCount || 0, Number(item.readCount) || 0);
        existing.favorite = existing.favorite || !!item.favorite;
        if (item.lastReadAt) existing.lastReadAt = new Date(item.lastReadAt);
        await existing.save();
      } else {
        await DuaProgress.create({
          userId,
          duaId: item.duaId,
          categoryId: item.categoryId || '',
          readCount: Number(item.readCount) || 0,
          favorite: !!item.favorite,
          lastReadAt: item.lastReadAt ? new Date(item.lastReadAt) : null,
        });
      }
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getDuas(req, res, next) {
  try {
    const items = await DuaProgress.find({ userId: req.user.id }).lean();
    return res.json({
      items: items.map((item) => ({
        duaId: item.duaId,
        categoryId: item.categoryId,
        readCount: item.readCount,
        favorite: item.favorite,
        lastReadAt: item.lastReadAt?.getTime?.() ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
}
