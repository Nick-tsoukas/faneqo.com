'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::marketer.marketer', ({ strapi }) => ({
  // GET /api/marketer/me/stats - Get stats for the logged-in marketer
  async myStats(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    if (!user.isMarketer) {
      return ctx.forbidden('You are not a marketer');
    }

    try {
      // Find the marketer record by user email
      const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
        filters: { email: user.email, isActive: true },
        limit: 1,
      });

      if (!marketers.length) {
        return ctx.notFound('Marketer record not found');
      }

      const marketer = marketers[0];

      // Get all referred users
      const referredUsers = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { referredByMarketer: marketer.id },
        fields: ['id', 'email', 'username', 'subscriptionStatus', 'trialEndsAt', 'createdAt'],
      });

      // Calculate stats
      const totalReferredUsers = referredUsers.length;
      const trialUsers = referredUsers.filter(u => u.subscriptionStatus === 'trialing').length;
      const activeUsers = referredUsers.filter(u => u.subscriptionStatus === 'active').length;
      const canceledUsers = referredUsers.filter(u => u.subscriptionStatus === 'canceled').length;

      // Monthly subscription price (from env or default)
      const monthlyPrice = parseFloat(process.env.MBQ_MONTHLY_PRICE) || 7.00;
      const commissionRate = (marketer.commissionPercent || 10) / 100;

      const estimatedMonthlyRevenue = activeUsers * monthlyPrice;
      const estimatedMonthlyCommission = estimatedMonthlyRevenue * commissionRate;

      // Signups this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const signupsThisMonth = referredUsers.filter(u => new Date(u.createdAt) >= startOfMonth).length;

      // Conversion rate (trial -> active)
      const convertedUsers = activeUsers;
      const totalTrialOrActive = trialUsers + activeUsers;
      const conversionRate = totalTrialOrActive > 0 ? (convertedUsers / totalTrialOrActive) * 100 : 0;

      // Calculate click-to-signup rate
      const clickToSignupRate = (marketer.totalClicks || 0) > 0 
        ? (totalReferredUsers / marketer.totalClicks) * 100 
        : 0;

      return {
        data: {
          totalReferredUsers,
          trialUsers,
          activeUsers,
          canceledUsers,
          estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue * 100) / 100,
          estimatedMonthlyCommission: Math.round(estimatedMonthlyCommission * 100) / 100,
          signupsThisMonth,
          conversionRate: Math.round(conversionRate * 10) / 10,
          commissionPercent: marketer.commissionPercent,
          totalClicks: marketer.totalClicks || 0,
          clicksToday: marketer.clicksToday || 0,
          clickToSignupRate: Math.round(clickToSignupRate * 10) / 10,
        },
      };
    } catch (error) {
      strapi.log.error('[marketer/myStats] Error:', error);
      return ctx.internalServerError('Failed to fetch marketer stats');
    }
  },

  // GET /api/marketer/me/users - Get referred users for the logged-in marketer
  async myUsers(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    if (!user.isMarketer) {
      return ctx.forbidden('You are not a marketer');
    }

    try {
      // Find the marketer record by user email
      const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
        filters: { email: user.email, isActive: true },
        limit: 1,
      });

      if (!marketers.length) {
        return ctx.notFound('Marketer record not found');
      }

      const marketer = marketers[0];
      const monthlyPrice = parseFloat(process.env.MBQ_MONTHLY_PRICE) || 7.00;
      const commissionRate = (marketer.commissionPercent || 10) / 100;

      // Get all referred users with pagination
      const { page = 1, pageSize = 25 } = ctx.query;
      const start = (parseInt(page) - 1) * parseInt(pageSize);

      const [referredUsers, total] = await Promise.all([
        strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: { referredByMarketer: marketer.id },
          fields: ['id', 'email', 'username', 'subscriptionStatus', 'trialEndsAt', 'createdAt', 'marketerCodeUsed', 'referredAt'],
          sort: { createdAt: 'desc' },
          start,
          limit: parseInt(pageSize),
        }),
        strapi.entityService.count('plugin::users-permissions.user', {
          filters: { referredByMarketer: marketer.id },
        }),
      ]);

      const users = referredUsers.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        status: u.subscriptionStatus || 'unknown',
        trialEndsAt: u.trialEndsAt,
        createdAt: u.createdAt,
        referredAt: u.referredAt,
        marketerCodeUsed: u.marketerCodeUsed,
        estimatedMonthlyValue: u.subscriptionStatus === 'active' ? Math.round(monthlyPrice * commissionRate * 100) / 100 : 0,
      }));

      return {
        data: users,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: Math.ceil(total / parseInt(pageSize)),
            total,
          },
        },
      };
    } catch (error) {
      strapi.log.error('[marketer/myUsers] Error:', error);
      return ctx.internalServerError('Failed to fetch referred users');
    }
  },

  // GET /api/marketer/by-code/:code - Public endpoint to validate marketer code
  async findByCode(ctx) {
    const { code } = ctx.params;
    if (!code) {
      return ctx.badRequest('Code is required');
    }

    const normalizedCode = code.trim().toLowerCase();

    const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
      filters: { code: normalizedCode, isActive: true },
      fields: ['id', 'name', 'code'],
      limit: 1,
    });

    if (!marketers.length) {
      return ctx.notFound('Marketer not found');
    }

    return { data: { id: marketers[0].id, name: marketers[0].name, code: marketers[0].code } };
  },

  // POST /api/marketer/track-click/:code - Public endpoint to track link clicks
  async trackClick(ctx) {
    const { code } = ctx.params;
    if (!code) {
      return ctx.badRequest('Code is required');
    }

    const normalizedCode = code.trim().toLowerCase();

    try {
      const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
        filters: { code: normalizedCode, isActive: true },
        limit: 1,
      });

      if (!marketers.length) {
        return ctx.notFound('Marketer not found');
      }

      const marketer = marketers[0];
      const today = new Date().toISOString().split('T')[0];
      const lastClickDate = marketer.lastClickDate;

      // Reset clicksToday if it's a new day
      let clicksToday = marketer.clicksToday || 0;
      if (lastClickDate !== today) {
        clicksToday = 0;
      }

      // Increment counters
      await strapi.entityService.update('api::marketer.marketer', marketer.id, {
        data: {
          totalClicks: (marketer.totalClicks || 0) + 1,
          clicksToday: clicksToday + 1,
          lastClickDate: today,
        },
      });

      strapi.log.info('[marketer/trackClick] Click recorded', { code: normalizedCode });
      return { success: true };
    } catch (error) {
      strapi.log.error('[marketer/trackClick] Error:', error);
      return ctx.internalServerError('Failed to track click');
    }
  },
}));
