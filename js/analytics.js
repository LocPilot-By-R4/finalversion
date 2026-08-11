(function () {
  'use strict';

  const config = window.LocPilotTrackingConfig || {};

  const state = {
    consent: {
      necessary: true,
      analytics: false,
      marketing: false,
    },
    metaLoaded: false,
    metaLoading: false,
    ga4Loaded: false,
    ga4Loading: false,
    ga4Configured: false,
    userTraits: {},
  };

  const META_STANDARD_EVENTS = new Set([
    'PageView',
    'ViewContent',
    'Lead',
    'Contact',
    'CompleteRegistration',
    'SubmitApplication',
    'Search',
    'AddToCart',
    'InitiateCheckout',
    'Purchase',
    'Schedule',
    'StartTrial',
    'Subscribe',
  ]);

  function normalizeConsent(raw) {
    return {
      necessary: true,
      analytics: raw?.analytics === true,
      marketing: raw?.marketing === true,
    };
  }

  function sanitizeEventName(name) {
    const safe = String(name || 'custom_event')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    return safe || 'custom_event';
  }

  function sanitizeParamName(name) {
    const safe = String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    return safe || null;
  }

  function sanitizeParams(params) {
    const out = {};
    if (!params || typeof params !== 'object') return out;

    Object.entries(params).forEach(([key, value]) => {
      const safeKey = sanitizeParamName(key);
      if (!safeKey) return;
      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string') {
        out[safeKey] = value.slice(0, 100);
        return;
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        out[safeKey] = value;
        return;
      }

      out[safeKey] = String(value).slice(0, 100);
    });

    return out;
  }

  function applyGoogleConsent() {
    if (typeof window.gtag !== 'function') return;

    window.gtag('consent', 'update', {
      analytics_storage: state.consent.analytics ? 'granted' : 'denied',
      ad_storage: state.consent.marketing ? 'granted' : 'denied',
      ad_user_data: state.consent.marketing ? 'granted' : 'denied',
      ad_personalization: state.consent.marketing ? 'granted' : 'denied',
    });
  }

  function sendToGA4(eventName, params) {
    if (!config.enableGA4 || !config.ga4MeasurementId) return false;
    if (!state.consent.analytics) return false;
    if (typeof window.gtag !== 'function') return false;

    window.gtag('event', sanitizeEventName(eventName), sanitizeParams(params));
    return true;
  }

  function loadScriptOnce(src, id) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-locpilot-loader="${id}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${id}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      script.dataset.locpilotLoader = id;

      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });

      script.addEventListener('error', () => {
        reject(new Error(`Failed to load ${id}`));
      }, { once: true });

      document.head.appendChild(script);
    });
  }


  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

  function runWhenIdle(callback, timeout = 4000) {
    const run = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout });
      } else {
        window.setTimeout(callback, Math.min(timeout, 2500));
      }
    };

    if (document.readyState === 'complete') {
      run();
    } else {
      window.addEventListener('load', run, { once: true });
    }
  }

  function configureGA4() {
    if (state.ga4Configured) return;
    if (!config.enableGA4 || !config.ga4MeasurementId) return;
    if (typeof window.gtag !== 'function') return;

    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });

    applyGoogleConsent();
    window.gtag('js', new Date());
    window.gtag('config', config.ga4MeasurementId, {
      anonymize_ip: true,
    });

    state.ga4Configured = true;
  }

  function ensureGA4() {
    if (!config.enableGA4 || !config.ga4MeasurementId) return Promise.resolve(false);
    if (!state.consent.analytics) return Promise.resolve(false);

    ensureGtagStub();

    if (state.ga4Loaded) {
      configureGA4();
      return Promise.resolve(true);
    }

    if (state.ga4Loading) return Promise.resolve(false);
    state.ga4Loading = true;

    return new Promise((resolve) => {
      runWhenIdle(async () => {
        try {
          await loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4MeasurementId)}`, 'ga4');
          state.ga4Loaded = true;
          configureGA4();
          resolve(true);
        } catch (error) {
          console.error('[LocPilotAnalytics] GA4 loading error:', error);
          resolve(false);
        } finally {
          state.ga4Loading = false;
        }
      });
    });
  }

  function ensureFbqStub() {
    if (window.fbq) return;

    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    window.fbq = fbq;
    window._fbq = fbq;
  }

  async function ensureMetaPixel() {
    if (!config.enableMetaPixel || !config.metaPixelId) return false;
    if (!state.consent.marketing) return false;
    if (state.metaLoaded) return true;
    if (state.metaLoading) return false;

    state.metaLoading = true;

    try {
      ensureFbqStub();
      await loadScriptOnce('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel');

      window.fbq('init', config.metaPixelId);
      window.fbq('consent', 'grant');
      window.fbq('track', 'PageView');

      state.metaLoaded = true;
      return true;
    } catch (error) {
      console.error('[LocPilotAnalytics] Meta Pixel loading error:', error);
      return false;
    } finally {
      state.metaLoading = false;
    }
  }

  function updateMetaConsent() {
    if (!window.fbq) return;
    try {
      window.fbq('consent', state.consent.marketing ? 'grant' : 'revoke');
    } catch (error) {
      console.warn('[LocPilotAnalytics] Meta consent update failed:', error);
    }
  }

  function sendToMeta(options) {
    if (!state.consent.marketing) return false;
    if (!state.metaLoaded || !window.fbq) return false;
    if (!options || !options.metaEventName) return false;

    const metaEventName = String(options.metaEventName);
    const metaParams = sanitizeParams(options.metaParams || {});

    if (META_STANDARD_EVENTS.has(metaEventName)) {
      window.fbq('track', metaEventName, metaParams);
    } else {
      window.fbq('trackCustom', metaEventName, metaParams);
    }

    return true;
  }

  async function setLeadIdentity(contact, traits) {
    const safeTraits = sanitizeParams(traits || {});
    state.userTraits = { ...state.userTraits, ...safeTraits };

    if (typeof window.gtag === 'function' && state.consent.analytics && Object.keys(state.userTraits).length) {
      window.gtag('set', 'user_properties', state.userTraits);
    }

    return Promise.resolve({
      storedTraits: state.userTraits,
      contactStored: false,
      hasContact: !!(contact?.email || contact?.phone),
    });
  }

  async function track(eventName, params, options = {}) {
    if (state.consent.analytics) {
      await ensureGA4();
    }
    sendToGA4(eventName, params);

    if (state.consent.marketing && options.metaEventName) {
      if (!state.metaLoaded) {
        await ensureMetaPixel();
      }
      sendToMeta(options);
    }
  }

  async function refreshConsent() {
    if (state.consent.analytics) {
      await ensureGA4();
    }
    applyGoogleConsent();

    if (state.consent.marketing) {
      await ensureMetaPixel();
      updateMetaConsent();
    } else {
      updateMetaConsent();
    }
  }

  window.addEventListener('locpilot:consent-updated', async (event) => {
    state.consent = normalizeConsent(event.detail || {});
    await refreshConsent();
  });

  if (window.LocPilotCookieConsent) {
    state.consent = normalizeConsent(window.LocPilotCookieConsent);
    refreshConsent();
  } else {
    applyGoogleConsent();
  }

  window.LocPilotAnalytics = {
    track,
    setLeadIdentity,
    getConsent() {
      return { ...state.consent };
    },
    refreshConsent,
  };
})();
