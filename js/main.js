// V19 MACHINE A CONVERTIR - orientation closing + tension
function bootSite() {
  // -------------------------------------------------------------------
  // Point d'entrée unique du site.
  // Les composants HTML sont injectés dynamiquement, donc on initialise
  // tout ici une fois que le DOM final est prêt.
  // -------------------------------------------------------------------
  initReveal();
  initProofSection();
  initRoiSimulator();
  if (typeof initCookieManager === 'function') initCookieManager();
  initAuditForm();
  initGenericTracking();
  initScrollTracking();
  initPricingViewTracking();
  initImmersionExperience();

  // V16 : couche commerciale supplémentaire
  if (typeof initCaseStudyCounters === 'function') initCaseStudyCounters();
  if (typeof initCaseGalleryLightbox === 'function') initCaseGalleryLightbox();
  if (typeof initClosingMachine === 'function') initClosingMachine();
  if (typeof initClosingAutomation === 'function') initClosingAutomation();
  if (typeof initStickyCloseBar === 'function') initStickyCloseBar();
}

document.addEventListener('components:loaded', bootSite, { once: true });

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-include]')) bootSite();
});

function initReveal() {
  const revealItems = document.querySelectorAll('.reveal');
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in');
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((el) => observer.observe(el));
  document.querySelector('.header-inner')?.classList.add('in');
}

function initProofSection() {
  const proofCards = document.getElementById('proofCards');
  const benefitsGrid = document.getElementById('benefitsGrid');
  if (!proofCards || !benefitsGrid) return;

  const cards = [
    {
      metric: '+28%',
      title: 'de réservations directes',
      text: 'Avant, la dépendance aux plateformes freinait la marge et la visibilité directe. Avec une structure plus claire et un pilotage plus cohérent, les réservations directes se sont renforcées.',
      author: 'Propriétaire de location saisonnière',
    },
    {
      metric: '+12 à +18%',
      title: 'de revenu par séjour',
      text: 'La différence ne vient pas seulement du remplissage. Elle vient du pilotage tarifaire, de la structuration des offres et de l’optimisation globale du bien.',
      author: 'Exploitant en zone touristique',
    },
    {
      metric: 'Pilotage',
      title: 'plus clair, plus fluide, plus rentable',
      text: 'LocPilot a remis de l’ordre dans la distribution, le pricing et la lecture de la performance. La prise de décision devient plus simple, plus rapide et plus rentable.',
      author: 'Hébergeur indépendant',
    },
  ];

  const benefits = [
    { title: 'Plus de direct', text: 'Réduire la dépendance aux OTA et reprendre la main sur la relation client.' },
    { title: 'Plus de cohérence tarifaire', text: 'Éviter de sous-vendre votre bien et protéger votre valeur perçue.' },
    { title: 'Plus de maîtrise', text: 'Piloter la performance avec méthode, au lieu de subir les plateformes.' },
    { title: 'Plus de rentabilité', text: 'Transformer un potentiel diffus en résultat mesurable et durable.' },
  ];

  proofCards.innerHTML = cards.map((card) => `
    <article class="proof-card reveal in">
      <div class="metric-pill">${card.metric}</div>
      <h3>${card.title}</h3>
      <p>“${card.text}”</p>
      <div class="proof-footer">
        <span class="author">— ${card.author}</span>
        <span class="stars">★★★★★</span>
      </div>
    </article>
  `).join('');

  benefitsGrid.innerHTML = benefits.map((item) => `
    <div class="benefit reveal in">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

function initRoiSimulator() {
  const bars = document.getElementById('bars');
  if (!bars || bars.dataset.bound === 'true') return;
  bars.dataset.bound = 'true';

  const get = (id) => document.getElementById(id);
  const formatCurrency = (value) => `${Math.round(value).toLocaleString('fr-FR')} €`;
  const formatCurrencyPrecise = (value) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const formatPercent = (value) => `${Math.round(value)}%`;
  const formatPercentSpaced = (value) => `${Math.round(value)} %`;

  const fields = {
    nightsSold: { min: 1, max: 365, step: 1 },
    nightPrice: { min: 1, max: 5000, step: 1 },
    otaHostCommission: { min: 0, max: 25, step: 0.5 },
    otaTravelerCommission: { min: 0, max: 20, step: 0.5 },
    conciergeCommission: { min: 0, max: 35, step: 0.5 },
    otaShareCurrent: { min: 0, max: 100, step: 1 },
    otaShareTarget: { min: 0, max: 100, step: 1 },
    priceLift: { min: 0, max: 25, step: 0.5 },
    nightsLift: { min: 0, max: 35, step: 0.5 },
    locpilotCommission: { min: 0, max: 20, step: 0.5 },
  };

  const defaultAdvanced = {
    otaShareTarget: 45,
    priceLift: 8,
    nightsLift: 12,
    locpilotCommission: 10,
  };

  const state = {
    nightsSold: 120,
    nightPrice: 120,
    otaHostCommission: 15,
    otaTravelerCommission: 12,
    conciergeCommission: 20,
    otaShareCurrent: 85,
    otaShareTarget: defaultAdvanced.otaShareTarget,
    priceLift: defaultAdvanced.priceLift,
    nightsLift: defaultAdvanced.nightsLift,
    locpilotCommission: defaultAdvanced.locpilotCommission,
    profile: 'custom',
    mode: 'simple',
  };

  const pricingSetupFeeReference = 590;
  const advancedDetails = get('roiAdvanced');
  const modeSimpleBtn = get('roiModeSimple');
  const modeAdvancedBtn = get('roiModeAdvanced');
  const modeHint = get('roiModeHint');

  const formatDisplay = (_, value) => {
    if (Number.isInteger(value)) return String(value);
    return String(value.toFixed(1)).replace('.0', '');
  };

  const clampValue = (key, value) => {
    const meta = fields[key];
    if (!meta) return value;
    const number = Number(String(value).replace(',', '.'));
    const safe = Number.isFinite(number) ? number : state[key];
    const clamped = Math.min(meta.max, Math.max(meta.min, safe));
    if (meta.step >= 1) return Math.round(clamped);
    return Math.round(clamped / meta.step) * meta.step;
  };

  function syncField(key) {
    const number = get(`${key}Input`);
    const value = clampValue(key, state[key]);
    state[key] = value;
    if (number) number.value = formatDisplay(key, value);
  }

  function syncInputs() {
    Object.keys(fields).forEach(syncField);
  }

  function applyPreset(type) {
    state.profile = type;

    if (type === 'station') {
      Object.assign(state, {
        nightsSold: 180,
        nightPrice: 180,
        otaHostCommission: 16,
        otaTravelerCommission: 14,
        conciergeCommission: 20,
        otaShareCurrent: 90,
        otaShareTarget: 45,
        priceLift: 10,
        nightsLift: 14,
        locpilotCommission: 10,
      });
    } else if (type === 'rural') {
      Object.assign(state, {
        nightsSold: 110,
        nightPrice: 105,
        otaHostCommission: 15,
        otaTravelerCommission: 12,
        conciergeCommission: 18,
        otaShareCurrent: 80,
        otaShareTarget: 40,
        priceLift: 6,
        nightsLift: 10,
        locpilotCommission: 10,
      });
    } else if (type === 'city') {
      Object.assign(state, {
        nightsSold: 210,
        nightPrice: 140,
        otaHostCommission: 17,
        otaTravelerCommission: 13,
        conciergeCommission: 22,
        otaShareCurrent: 88,
        otaShareTarget: 50,
        priceLift: 7,
        nightsLift: 9,
        locpilotCommission: 10,
      });
    } else {
      Object.assign(state, {
        nightsSold: 120,
        nightPrice: 120,
        otaHostCommission: 15,
        otaTravelerCommission: 12,
        conciergeCommission: 20,
        otaShareCurrent: 85,
        otaShareTarget: defaultAdvanced.otaShareTarget,
        priceLift: defaultAdvanced.priceLift,
        nightsLift: defaultAdvanced.nightsLift,
        locpilotCommission: defaultAdvanced.locpilotCommission,
      });
    }

    syncInputs();
    render();

    window.LocPilotAnalytics?.track('roi_simulation_click', {
      interaction_type: 'preset',
      preset_name: type || 'custom',
    });
  }

  function setMode(mode, { track = false } = {}) {
    state.mode = mode === 'advanced' ? 'advanced' : 'simple';

    if (advancedDetails) {
      advancedDetails.open = state.mode === 'advanced';
    }

    if (modeSimpleBtn) {
      modeSimpleBtn.classList.toggle('is-active', state.mode === 'simple');
      modeSimpleBtn.setAttribute('aria-pressed', state.mode === 'simple' ? 'true' : 'false');
    }

    if (modeAdvancedBtn) {
      modeAdvancedBtn.classList.toggle('is-active', state.mode === 'advanced');
      modeAdvancedBtn.setAttribute('aria-pressed', state.mode === 'advanced' ? 'true' : 'false');
    }

    if (modeHint) {
      modeHint.textContent = state.mode === 'advanced'
        ? 'Mode avancé : vous ouvrez les hypothèses de projection pour affiner le scénario et visualiser un cas plus précis.'
        : 'Mode simple : vous saisissez uniquement les chiffres les plus importants. Le mode avancé ouvre les hypothèses de projection pour affiner le scénario.';
    }

    if (track) {
      window.LocPilotAnalytics?.track('roi_simulation_click', {
        interaction_type: 'mode',
        roi_mode: state.mode,
      });
    }
  }

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      applyPreset(btn.getAttribute('data-preset'));
    });
  });

  [modeSimpleBtn, modeAdvancedBtn].forEach((btn) => {
    if (!btn || btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      setMode(btn.dataset.roiMode, { track: true });
      render();
    });
  });

  if (advancedDetails && advancedDetails.dataset.bound !== 'true') {
    advancedDetails.dataset.bound = 'true';
    advancedDetails.addEventListener('toggle', () => {
      const mode = advancedDetails.open ? 'advanced' : 'simple';
      if (state.mode !== mode) {
        setMode(mode, { track: true });
        render();
      }
    });
  }

  Object.keys(fields).forEach((key) => {
    const number = get(`${key}Input`);
    if (number && number.dataset.bound !== 'true') {
      number.dataset.bound = 'true';
      const onNumberChange = () => {
        state[key] = clampValue(key, number.value);
        syncField(key);
        render();
      };
      number.addEventListener('input', onNumberChange);
      number.addEventListener('change', onNumberChange);
      number.addEventListener('blur', onNumberChange);
    }
  });

  function calc() {
    const caActuel = state.nightsSold * state.nightPrice;

    // Important : le net propriétaire ne doit déduire que les commissions
    // effectivement supportées par le propriétaire.
    // La commission OTA côté voyageur reste une information marché utile,
    // mais elle n'est pas retirée du net affiché ici.
    const ownerOtaRate = state.otaHostCommission / 100;
    const travelerOtaRate = state.otaTravelerCommission / 100;

    const commissionOtaActuelle =
      caActuel *
      (state.otaShareCurrent / 100) *
      ownerOtaRate;

    const surchargeVoyageurActuelle =
      caActuel *
      (state.otaShareCurrent / 100) *
      travelerOtaRate;

    const commissionConciergerieActuelle =
      caActuel * (state.conciergeCommission / 100);

    const commissionsActuelles =
      commissionOtaActuelle + commissionConciergerieActuelle;

    const revenuNetActuel = caActuel - commissionsActuelles;

    const projectedNightPrice =
      state.nightPrice * (1 + state.priceLift / 100);

    const projectedNightsSold =
      state.nightsSold * (1 + state.nightsLift / 100);

    const caProjete = projectedNightPrice * projectedNightsSold;

    const commissionOtaProjete =
      caProjete *
      (state.otaShareTarget / 100) *
      ownerOtaRate;

    const surchargeVoyageurProjete =
      caProjete *
      (state.otaShareTarget / 100) *
      travelerOtaRate;

    const commissionLocPilot =
      caProjete * (state.locpilotCommission / 100);

    const revenuNetProjete =
      caProjete - commissionOtaProjete - commissionLocPilot;

    const commissionsEconomisees =
      commissionsActuelles - (commissionOtaProjete + commissionLocPilot);

    const gainNetAnnuel = revenuNetProjete - revenuNetActuel;
    const gainNetMensuel = gainNetAnnuel / 12;

    const directCurrent = 100 - state.otaShareCurrent;
    const directTarget = 100 - state.otaShareTarget;
    const dependencyShiftPoints = state.otaShareCurrent - state.otaShareTarget;
    const directProgressionPoints = directTarget - directCurrent;

    const paybackMonths = gainNetMensuel > 0 ? pricingSetupFeeReference / gainNetMensuel : null;

    const priceDeltaPerNight = projectedNightPrice - state.nightPrice;
    const occupancyDeltaNights = projectedNightsSold - state.nightsSold;
    const pricingImpactEstimate = Math.max(0, priceDeltaPerNight * state.nightsSold);
    const occupancyImpactEstimate = Math.max(0, occupancyDeltaNights * projectedNightPrice);
    const directMixImpactEstimate = Math.max(0, commissionsEconomisees);

    const otaTravelerPriceCurrent = state.nightPrice * (1 + travelerOtaRate);
    const directTravelerPriceCurrent = state.nightPrice;
    const travelerSurchargePerNight = otaTravelerPriceCurrent - directTravelerPriceCurrent;
    const otaTravelerNightsCurrent = state.nightsSold * (state.otaShareCurrent / 100);
    const travelerAnnualSurchargeCurrent = otaTravelerNightsCurrent * travelerSurchargePerNight;

    return {
      caActuel,
      commissionOtaActuelle,
      surchargeVoyageurActuelle,
      commissionConciergerieActuelle,
      commissionsActuelles,
      revenuNetActuel,
      projectedNightPrice,
      projectedNightsSold,
      caProjete,
      commissionOtaProjete,
      surchargeVoyageurProjete,
      commissionLocPilot,
      revenuNetProjete,
      commissionsEconomisees,
      gainNetAnnuel,
      gainNetMensuel,
      directCurrent,
      directTarget,
      dependencyShiftPoints,
      directProgressionPoints,
      paybackMonths,
      pricingImpactEstimate,
      occupancyImpactEstimate,
      directMixImpactEstimate,
      otaTravelerPriceCurrent,
      directTravelerPriceCurrent,
      travelerSurchargePerNight,
      travelerAnnualSurchargeCurrent,
      otaTravelerNightsCurrent,
    };
  }

  function formatPayback(value) {
    if (!Number.isFinite(value) || value <= 0) return 'Non amorti';
    if (value < 1) return 'Moins d’1 mois';
    return `${value.toFixed(1).replace('.', ',')} mois`;
  }

  function getBusinessDrivers(c) {
    const drivers = [
      {
        key: 'distribution',
        label: `${Math.abs(Math.round(c.dependencyShiftPoints))} pts d’OTA en moins`,
        description: 'la baisse de dépendance OTA',
        weight: Math.max(0, c.directMixImpactEstimate),
      },
      {
        key: 'pricing',
        label: `+${formatDisplay('priceLift', state.priceLift)} % prix moyen`,
        description: 'la hausse du prix moyen',
        weight: Math.max(0, c.pricingImpactEstimate),
      },
      {
        key: 'occupancy',
        label: `+${formatDisplay('nightsLift', state.nightsLift)} % nuitées`,
        description: 'la progression du remplissage',
        weight: Math.max(0, c.occupancyImpactEstimate),
      },
      {
        key: 'direct',
        label: `+${Math.round(c.directProgressionPoints)} pts de direct`,
        description: 'la hausse de la part directe',
        weight: Math.max(0, c.directProgressionPoints * 100),
      },
    ];

    return drivers
      .filter((driver) => driver.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }

  function buildBusinessSummary(c, drivers) {
    if (!drivers.length) {
      return 'Le potentiel reste modéré avec les hypothèses actuelles. Passez en mode avancé pour tester un scénario plus ambitieux.';
    }

    const labels = drivers.map((driver) => driver.description);
    if (labels.length >= 3) {
      return `Le principal levier ici est ${labels[0]}. Ensuite viennent ${labels[1]} et ${labels[2]}.`;
    }
    if (labels.length === 2) {
      return `Le principal levier ici est ${labels[0]}. Ensuite vient ${labels[1]}.`;
    }
    return `Le principal levier ici est ${labels[0]}.`;
  }

  const donutProg = get('donutProg');
  const donutText = get('donutText');
  const miniOtaCurrent = get('miniOtaCurrent');
  const miniOtaTarget = get('miniOtaTarget');
  const stats = get('stats');
  const roiHeroValue = get('roiHeroValue');
  const roiHeroCopy = get('roiHeroCopy');
  const roiHeroNetCurrent = get('roiHeroNetCurrent');
  const roiHeroNetProjected = get('roiHeroNetProjected');
  const roiSlimMonthlyGain = get('roiSlimMonthlyGain');
  const roiPaybackValue = get('roiPaybackValue');
  const roiPaybackHint = get('roiPaybackHint');
  const roiDependencyShift = get('roiDependencyShift');
  const roiDependencyHint = get('roiDependencyHint');
  const roiTravelerAdvantageCopy = get('roiTravelerAdvantageCopy');
  const roiTravelerOtaPrice = get('roiTravelerOtaPrice');
  const roiTravelerDirectPrice = get('roiTravelerDirectPrice');
  const roiTravelerSurchargePerNight = get('roiTravelerSurchargePerNight');
  const roiTravelerAnnualSurcharge = get('roiTravelerAnnualSurcharge');
  const roiTravelerAdvantageHint = get('roiTravelerAdvantageHint');
  const roiBusinessSummary = get('roiBusinessSummary');
  const roiBusinessPills = get('roiBusinessPills');
  const circumference = 2 * Math.PI * 64;

  function render() {
    const c = calc();
    const drivers = getBusinessDrivers(c);
    const businessSummary = buildBusinessSummary(c, drivers);

    const values = [
      { key: 'ca', label: 'CA actuel', value: c.caActuel },
      { key: 'commissions', label: 'Commissions actuelles', value: c.commissionsActuelles },
      { key: 'netCurrent', label: 'Net actuel', value: c.revenuNetActuel },
      { key: 'netProjected', label: 'Net projeté', value: c.revenuNetProjete },
    ];

    const max = Math.max(...values.map((v) => Math.max(v.value, 0)), 1);

    if (bars) {
      bars.innerHTML = values.map((v) => `
        <div>
          <div class="barline">
            <span>${v.label}</span>
            <span>${formatCurrency(v.value)}</span>
          </div>
          <div class="barbg">
            <div class="barfg ${v.key === 'netProjected' ? 'total' : ''}" style="width:${(Math.max(v.value, 0) / max) * 100}%"></div>
          </div>
        </div>
      `).join('');
    }

    const pct = Math.max(0, Math.min(100, state.otaShareTarget));
    const dash = (pct / 100) * circumference;

    if (donutProg) donutProg.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
    if (donutText) donutText.textContent = formatPercent(state.otaShareTarget);
    if (miniOtaCurrent) miniOtaCurrent.textContent = formatPercent(state.otaShareCurrent);
    if (miniOtaTarget) miniOtaTarget.textContent = formatPercent(state.otaShareTarget);

    if (roiHeroValue) {
      roiHeroValue.textContent = `${Math.round(c.gainNetAnnuel).toLocaleString('fr-FR')} € / an`;
    }
    if (roiHeroCopy) {
      roiHeroCopy.textContent = c.gainNetAnnuel > 0
        ? 'Vous pourriez récupérer une part importante de marge en réduisant votre dépendance aux OTA, en pilotant mieux vos réservations et en travaillant davantage le direct.'
        : 'Le potentiel reste limité avec les hypothèses saisies. Passez en mode avancé pour tester un scénario plus ambitieux.';
    }
    if (roiHeroNetCurrent) {
      roiHeroNetCurrent.textContent = formatCurrency(c.revenuNetActuel);
    }
    if (roiHeroNetProjected) {
      roiHeroNetProjected.textContent = formatCurrency(c.revenuNetProjete);
    }
    if (roiSlimMonthlyGain) {
      roiSlimMonthlyGain.textContent = `${formatCurrency(c.gainNetMensuel)} / mois`;
    }

    if (roiPaybackValue) {
      roiPaybackValue.textContent = formatPayback(c.paybackMonths);
    }
    if (roiPaybackHint) {
      roiPaybackHint.textContent = Number.isFinite(c.paybackMonths) && c.paybackMonths > 0
        ? `Sur la base de ${pricingSetupFeeReference.toLocaleString('fr-FR')} € de mise en place Performance.`
        : `Le gain mensuel estimé ne couvre pas encore une mise en place de ${pricingSetupFeeReference.toLocaleString('fr-FR')} €.`;
    }
    if (roiDependencyShift) {
      const sign = c.dependencyShiftPoints > 0 ? '-' : '';
      roiDependencyShift.textContent = `${sign}${Math.abs(Math.round(c.dependencyShiftPoints))} points`;
    }
    if (roiDependencyHint) {
      roiDependencyHint.textContent = `${formatPercentSpaced(state.otaShareCurrent)} → ${formatPercentSpaced(state.otaShareTarget)}`;
    }

    if (roiTravelerOtaPrice) {
      roiTravelerOtaPrice.textContent = formatCurrencyPrecise(c.otaTravelerPriceCurrent);
    }
    if (roiTravelerDirectPrice) {
      roiTravelerDirectPrice.textContent = formatCurrencyPrecise(c.directTravelerPriceCurrent);
    }
    if (roiTravelerSurchargePerNight) {
      roiTravelerSurchargePerNight.textContent = formatCurrencyPrecise(c.travelerSurchargePerNight);
    }
    if (roiTravelerAnnualSurcharge) {
      roiTravelerAnnualSurcharge.textContent = formatCurrencyPrecise(c.travelerAnnualSurchargeCurrent);
    }
    if (roiTravelerAdvantageCopy) {
      roiTravelerAdvantageCopy.textContent = state.otaTravelerCommission > 0
        ? 'À tarif propriétaire identique, la commission voyageur renchérit le prix affiché sur les plateformes. Cet écart peut être exploité pour rendre votre canal direct plus compétitif.'
        : 'Avec une commission voyageur à 0 %, il n’y a pas de surcoût prix côté OTA sur ce scénario. Vous pouvez néanmoins conserver cet indicateur pour comparer vos canaux.';
    }
    if (roiTravelerAdvantageHint) {
      roiTravelerAdvantageHint.textContent = state.otaTravelerCommission > 0
        ? `Sur ${Math.round(c.otaTravelerNightsCurrent).toLocaleString('fr-FR')} nuitées OTA estimées par an (sur ${Math.round(state.nightsSold).toLocaleString('fr-FR')} nuitées totales saisies), vos voyageurs supportent environ ${formatCurrencyPrecise(c.travelerAnnualSurchargeCurrent)} de surcoût. Ce montant ne réduit pas directement votre net, mais il fragilise la compétitivité prix de vos annonces face au direct.`
        : 'Ce montant ne réduit pas directement votre net propriétaire. Il sert à visualiser l’écart de prix entre OTA et direct du point de vue du voyageur.';
    }

    if (stats) {
      const statsItems = [
        {
          title: 'Commissions actuelles',
          value: formatCurrency(c.commissionsActuelles),
          note: 'Ce que votre exploitation laisse partir aujourd’hui entre OTA et conciergerie.',
          accent: false,
        },
        {
          title: 'Commissions économisées',
          value: formatCurrency(c.commissionsEconomisees),
          note: 'Marge potentiellement récupérable avec un pilotage plus propre.',
          accent: false,
        },
        {
          title: 'Part directe actuelle → cible',
          value: `${formatPercentSpaced(c.directCurrent)} → ${formatPercentSpaced(c.directTarget)}`,
          note: `Soit +${Math.round(c.directProgressionPoints)} points de direct si le scénario se confirme.`,
          accent: true,
        },
      ];

      stats.innerHTML = statsItems.map((item) => `
        <div class="stat stat--slim ${item.accent ? 'gold' : ''}">
          <div class="t">${item.title}</div>
          <div class="v">${item.value}</div>
          <div class="n">${item.note}</div>
        </div>
      `).join('');
    }

    if (roiBusinessSummary) {
      roiBusinessSummary.textContent = businessSummary;
    }

    if (roiBusinessPills) {
      const fallbackPills = [
        `+${formatDisplay('priceLift', state.priceLift)} % prix moyen`,
        `+${formatDisplay('nightsLift', state.nightsLift)} % nuitées`,
        `${Math.abs(Math.round(c.dependencyShiftPoints))} pts d’OTA en moins`,
      ];

      const pills = (drivers.length ? drivers.map((driver) => driver.label) : fallbackPills).slice(0, 3);
      roiBusinessPills.innerHTML = pills.map((pill) => `<span class="roi-business-pill">${pill}</span>`).join('');
    }

    window.LocPilotRoiSnapshot = {
      nightsSold: formatDisplay('nightsSold', state.nightsSold),
      nightPrice: formatDisplay('nightPrice', state.nightPrice),
      otaHostCommission: formatDisplay('otaHostCommission', state.otaHostCommission),
      otaTravelerCommission: formatDisplay('otaTravelerCommission', state.otaTravelerCommission),
      conciergeCommission: formatDisplay('conciergeCommission', state.conciergeCommission),
      otaShareCurrent: formatDisplay('otaShareCurrent', state.otaShareCurrent),
      otaShareTarget: formatDisplay('otaShareTarget', state.otaShareTarget),
      priceLift: formatDisplay('priceLift', state.priceLift),
      nightsLift: formatDisplay('nightsLift', state.nightsLift),
      locpilotCommission: formatDisplay('locpilotCommission', state.locpilotCommission),
      caActuel: formatCurrency(c.caActuel),
      commissionsActuelles: formatCurrency(c.commissionsActuelles),
      revenuNetActuel: formatCurrency(c.revenuNetActuel),
      revenuNetProjete: formatCurrency(c.revenuNetProjete),
      commissionsEconomisees: formatCurrency(c.commissionsEconomisees),
      gainNetAnnuel: formatCurrency(c.gainNetAnnuel),
      gainNetMensuel: formatCurrency(c.gainNetMensuel),
      directCurrent: formatPercent(c.directCurrent),
      directTarget: formatPercent(c.directTarget),
      dependencyShift: `${Math.abs(Math.round(c.dependencyShiftPoints))} points`,
      paybackPeriod: formatPayback(c.paybackMonths),
      directProgression: `+${Math.round(c.directProgressionPoints)} points`,
      travelerOtaPriceCurrent: formatCurrencyPrecise(c.otaTravelerPriceCurrent),
      travelerDirectPriceCurrent: formatCurrencyPrecise(c.directTravelerPriceCurrent),
      travelerSurchargePerNight: formatCurrencyPrecise(c.travelerSurchargePerNight),
      travelerAnnualSurchargeCurrent: formatCurrencyPrecise(c.travelerAnnualSurchargeCurrent),
      businessSummary,
      advancedOpened: advancedDetails?.open ? 'oui' : 'non',
      roiMode: state.mode,
      setupCostReference: formatCurrency(pricingSetupFeeReference),
    };
  }

  syncInputs();
  setMode(advancedDetails?.open ? 'advanced' : 'simple');
  render();
}

function initAuditForm() {
  // -------------------------------------------------------------------
  // V16 — FORMULAIRE FINAL / MACHINE À SIGNER
  // -------------------------------------------------------------------
  // Ce formulaire n'est plus seulement un bouton WhatsApp.
  // Il prépare un pré-diagnostic commercial :
  // - contexte du bien
  // - niveau d'urgence
  // - créneau de rappel préféré
  // - score de lead
  // - snapshot ROI courant
  //
  // Deux sorties sont possibles :
  // 1) audit WhatsApp immédiat
  // 2) demande de rappel prioritaire
  // -------------------------------------------------------------------
  const primaryBtn = document.getElementById('sendWhatsapp');
  const callbackBtn = document.getElementById('requestCallback');
  if (!primaryBtn) return;

  if (primaryBtn.dataset.bound === 'true') return;
  primaryBtn.dataset.bound = 'true';
  if (callbackBtn) callbackBtn.dataset.bound = 'true';

  const phone = '33784298202';
  const err = document.getElementById('formError');
  const formLoadedAt = Date.now();

  const getVal = (id) => (document.getElementById(id)?.value || '').trim();

  const markInvalid = (id, bad) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('invalid', !!bad);
  };

  const clearValidation = () => {
    ['fName', 'fContact', 'fLocation', 'fGoal'].forEach((id) => markInvalid(id, false));
    if (err) {
      err.textContent = '';
      err.classList.remove('show');
    }
  };

  const showError = (msg) => {
    if (!err) return;
    err.textContent = msg;
    err.classList.add('show');
  };

  const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const digitsOnly = (v) => (v || '').replace(/\D/g, '');
  const looksLikePhone = (v) => {
    const d = digitsOnly(v);
    return d.length === 10 || (d.length >= 11 && d.length <= 13);
  };

  const tooSpammy = (value) => {
    const t = (value || '').trim();
    if (!t || t.length < 8) return true;
    if (/^(.)\1{5,}$/.test(t.replace(/\s/g, ''))) return true;
    return false;
  };

  const classifyUnits = (rawValue) => {
    const units = Number.parseInt(rawValue, 10);
    if (Number.isNaN(units) || units <= 0) return { units: 0, bucket: 'unknown', estimatedMonthlyValue: 0 };
    if (units === 1) return { units, bucket: '1', estimatedMonthlyValue: 159 };
    if (units <= 3) return { units, bucket: '2_3', estimatedMonthlyValue: units * 159 };
    if (units <= 10) return { units, bucket: '4_10', estimatedMonthlyValue: units * 159 };
    return { units, bucket: '10_plus', estimatedMonthlyValue: units * 159 };
  };

  const normalizeStatus = (status) => {
    if (!status) return 'unknown';
    const map = {
      LMNP: 'lmnp',
      LMP: 'lmp',
      Conciergerie: 'conciergerie',
      'Hôtel': 'hotel',
      Hotel: 'hotel',
    };
    return map[status] || status.toLowerCase();
  };

  const detectIntent = (goal) => {
    const text = (goal || '').toLowerCase();
    const tags = [];
    if (/direct|réservation directe|reservation directe/.test(text)) tags.push('direct_booking');
    if (/airbnb|booking|plateforme|ota/.test(text)) tags.push('ota_dependency');
    if (/rentabil|revenu|ca|chiffre/.test(text)) tags.push('revenue_growth');
    if (/prix|pricing|tarif|yield/.test(text)) tags.push('pricing');
    if (/visibil|seo|geo|site/.test(text)) tags.push('visibility');
    if (/automatis|temps|gestion/.test(text)) tags.push('automation');
    return tags.length ? tags : ['generic'];
  };

  const inferPropertyType = (location) => {
    const text = (location || '').toLowerCase();
    if (/h[oô]tel/.test(text)) return 'hotel';
    if (/appart|studio|t1|t2|t3|t4|t5|résidence|residence/.test(text)) return 'apartment';
    if (/chalet|maison|villa/.test(text)) return 'house';
    if (/g[iî]te|gite/.test(text)) return 'gite';
    return 'unknown';
  };

  const normalizeUrgency = (value) => {
    const map = {
      immediate: 'immédiat',
      '30_days': 'sous_30_jours',
      exploration: 'exploration'
    };
    return map[value] || 'non_renseigne';
  };

  const normalizeCallWindow = (value) => {
    const map = {
      morning: 'matin',
      afternoon: 'apres_midi',
      evening: 'fin_journee'
    };
    return map[value] || 'non_renseigne';
  };

  const computeLeadScore = ({ status, unitsBucket, intents, listing, urgency }) => {
    let score = 35;
    if (status === 'hotel' || status === 'conciergerie') score += 20;
    if (status === 'lmnp' || status === 'lmp') score += 10;
    if (unitsBucket === '2_3') score += 10;
    if (unitsBucket === '4_10') score += 20;
    if (unitsBucket === '10_plus') score += 25;
    if (listing) score += 8;
    if (intents.includes('direct_booking')) score += 8;
    if (intents.includes('revenue_growth')) score += 8;
    if (intents.includes('ota_dependency')) score += 6;
    if (intents.includes('pricing')) score += 5;
    if (urgency === 'immédiat') score += 12;
    if (urgency === 'sous_30_jours') score += 7;
    return Math.min(100, score);
  };

  const scoreToTier = (score) => {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    return 'cold';
  };

  const validate = () => {
    clearValidation();

    const name = getVal('fName');
    const contact = getVal('fContact');
    const location = getVal('fLocation');
    const goal = getVal('fGoal');
    const honeypot = getVal('company');

    let ok = true;

    if (honeypot) {
      showError('Erreur de validation.');
      return false;
    }

    if (Date.now() - formLoadedAt < 1200) {
      showError('Merci de prendre le temps de remplir le formulaire.');
      return false;
    }

    if (!name || name.length < 2) {
      markInvalid('fName', true);
      ok = false;
    }

    if (!location || location.length < 3) {
      markInvalid('fLocation', true);
      ok = false;
    }

    if (tooSpammy(goal)) {
      markInvalid('fGoal', true);
      ok = false;
    }

    if (!(contact && (looksLikeEmail(contact) || looksLikePhone(contact)))) {
      markInvalid('fContact', true);
      ok = false;
    }

    if (!ok) {
      showError('Merci de remplir correctement les champs obligatoires avec des informations valides.');
    }

    return ok;
  };

  ['fName', 'fContact', 'fLocation', 'fGoal'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound === 'true') return;
    el.dataset.bound = 'true';
    el.addEventListener('input', () => {
      el.classList.remove('invalid');
      if (err) err.classList.remove('show');
    });
  });

  const extractRoiSnapshot = () => {
    if (window.LocPilotRoiSnapshot) return window.LocPilotRoiSnapshot;

    return {
      nightsSold: '',
      nightPrice: '',
      otaHostCommission: '',
      otaTravelerCommission: '',
      conciergeCommission: '',
      otaShareCurrent: '',
      otaShareTarget: '',
      priceLift: '',
      nightsLift: '',
      locpilotCommission: '',
      caActuel: '',
      commissionsActuelles: '',
      revenuNetActuel: '',
      revenuNetProjete: '',
      commissionsEconomisees: '',
      gainNetAnnuel: '',
      gainNetMensuel: '',
      directCurrent: '',
      directTarget: '',
      dependencyShift: '',
      paybackPeriod: '',
      directProgression: '',
      businessSummary: '',
      setupCostReference: '',
    };
  };

  const buildLeadContext = (actionIntent) => {
    const vals = {
      name: getVal('fName'),
      contact: getVal('fContact'),
      location: getVal('fLocation'),
      status: getVal('fStatus'),
      units: getVal('fUnits'),
      listing: getVal('fListing'),
      urgency: getVal('fUrgency'),
      callWindow: getVal('fCallWindow'),
      goal: getVal('fGoal')
    };

    const unitInfo = classifyUnits(vals.units);
    const normalizedStatus = normalizeStatus(vals.status);
    const intents = detectIntent(vals.goal);
    const propertyType = inferPropertyType(vals.location);
    const urgency = normalizeUrgency(vals.urgency);
    const callWindow = normalizeCallWindow(vals.callWindow);
    const leadScore = computeLeadScore({
      status: normalizedStatus,
      unitsBucket: unitInfo.bucket,
      intents,
      listing: !!vals.listing,
      urgency
    });

    const contactType = /@/.test(vals.contact) ? 'email' : 'phone';
    const roiSnapshot = extractRoiSnapshot();

    return {
      values: vals,
      roiSnapshot,
      actionIntent,
      analytics: {
        lead_type: normalizedStatus,
        property_type: propertyType,
        property_count_bucket: unitInfo.bucket,
        property_count: unitInfo.units || 0,
        lead_score: leadScore,
        lead_tier: scoreToTier(leadScore),
        primary_intent: intents[0],
        intent_count: intents.length,
        has_listing_url: vals.listing ? 'yes' : 'no',
        contact_type: contactType,
        estimated_monthly_value: unitInfo.estimatedMonthlyValue,
        urgency_level: urgency,
        preferred_call_window: callWindow,
        action_intent: actionIntent
      },
      contact: {
        name: vals.name,
        email: contactType === 'email' ? vals.contact : '',
        phone: contactType === 'phone' ? vals.contact : '',
      },
      intents
    };
  };

  const buildMessage = (ctx) => {
    const lines = [];
    const vals = ctx.values;

    lines.push('Demande LocPilot — pré-diagnostic');
    lines.push('');
    lines.push('Action souhaitée : ' + (ctx.actionIntent === 'priority_callback' ? 'Rappel prioritaire' : 'Audit WhatsApp'));
    lines.push('');

    if (vals.name) lines.push('Nom : ' + vals.name);
    if (vals.contact) lines.push('Contact : ' + vals.contact);
    if (vals.location) lines.push('Localité + bien : ' + vals.location);
    if (vals.status) lines.push('Statut : ' + vals.status);
    if (vals.units) lines.push('Nombre de biens : ' + vals.units);
    if (vals.listing) lines.push('Lien annonce : ' + vals.listing);
    if (vals.urgency) lines.push('Urgence : ' + vals.urgency);
    if (vals.callWindow) lines.push('Créneau préféré : ' + vals.callWindow);

    lines.push('');
    lines.push('Objectif :');
    lines.push(vals.goal);

    lines.push('');
    lines.push('Simulation ROI :');
    if (ctx.roiSnapshot.nightsSold) lines.push('Nuitées vendues / an : ' + ctx.roiSnapshot.nightsSold);
    if (ctx.roiSnapshot.nightPrice) lines.push('Prix moyen / nuit : ' + ctx.roiSnapshot.nightPrice + ' €');
    if (ctx.roiSnapshot.otaHostCommission) lines.push('Commission OTA propriétaire : ' + ctx.roiSnapshot.otaHostCommission + ' %');
    if (ctx.roiSnapshot.otaTravelerCommission) lines.push('Commission OTA voyageur : ' + ctx.roiSnapshot.otaTravelerCommission + ' %');
    if (ctx.roiSnapshot.conciergeCommission) lines.push('Commission conciergerie : ' + ctx.roiSnapshot.conciergeCommission + ' %');
    if (ctx.roiSnapshot.otaShareCurrent) lines.push('Part OTA actuelle : ' + ctx.roiSnapshot.otaShareCurrent + ' %');
    if (ctx.roiSnapshot.otaShareTarget) lines.push('Part OTA cible : ' + ctx.roiSnapshot.otaShareTarget + ' %');
    if (ctx.roiSnapshot.priceLift) lines.push('Hausse estimée prix moyen : +' + ctx.roiSnapshot.priceLift + ' %');
    if (ctx.roiSnapshot.nightsLift) lines.push('Hausse estimée nuitées : +' + ctx.roiSnapshot.nightsLift + ' %');
    if (ctx.roiSnapshot.locpilotCommission) lines.push('Commission LocPilot estimée : ' + ctx.roiSnapshot.locpilotCommission + ' %');

    lines.push('');
    if (ctx.roiSnapshot.caActuel) lines.push('CA actuel : ' + ctx.roiSnapshot.caActuel);
    if (ctx.roiSnapshot.commissionsActuelles) lines.push('Commissions actuelles : ' + ctx.roiSnapshot.commissionsActuelles);
    if (ctx.roiSnapshot.revenuNetActuel) lines.push('Revenu net actuel : ' + ctx.roiSnapshot.revenuNetActuel);
    if (ctx.roiSnapshot.revenuNetProjete) lines.push('Revenu net projeté : ' + ctx.roiSnapshot.revenuNetProjete);
    if (ctx.roiSnapshot.commissionsEconomisees) lines.push('Commissions économisées : ' + ctx.roiSnapshot.commissionsEconomisees);
    if (ctx.roiSnapshot.gainNetMensuel) lines.push('Gain net mensuel estimé : ' + ctx.roiSnapshot.gainNetMensuel);
    if (ctx.roiSnapshot.gainNetAnnuel) lines.push('Gain net annuel estimé : ' + ctx.roiSnapshot.gainNetAnnuel);
    if (ctx.roiSnapshot.travelerSurchargePerNight) lines.push('Surcoût OTA payé par le voyageur / nuit : ' + ctx.roiSnapshot.travelerSurchargePerNight);
    if (ctx.roiSnapshot.travelerAnnualSurchargeCurrent) lines.push('Surcoût OTA payé par les voyageurs / an : ' + ctx.roiSnapshot.travelerAnnualSurchargeCurrent);
    if (ctx.roiSnapshot.paybackPeriod) lines.push("Temps d’amortissement estimé : " + ctx.roiSnapshot.paybackPeriod);
    if (ctx.roiSnapshot.directCurrent) lines.push('Part directe actuelle : ' + ctx.roiSnapshot.directCurrent);
    if (ctx.roiSnapshot.directTarget) lines.push('Part directe cible : ' + ctx.roiSnapshot.directTarget);
    if (ctx.roiSnapshot.dependencyShift) lines.push('Baisse de dépendance OTA : ' + ctx.roiSnapshot.dependencyShift);
    if (ctx.roiSnapshot.businessSummary) {
      lines.push('');
      lines.push('Lecture business :');
      lines.push(ctx.roiSnapshot.businessSummary);
    }

    if (ctx.actionIntent === 'priority_callback') {
      lines.push('');
      lines.push('Je souhaite être rappelé rapidement pour valider la prochaine étape.');
    } else {
      lines.push('');
      lines.push('Je souhaite recevoir un pré-diagnostic et voir si un échange court est pertinent.');
    }

    return lines.join('\n');
  };

  const openWhatsapp = async (actionIntent) => {
    if (!validate()) return;

    const ctx = buildLeadContext(actionIntent);

    await window.LocPilotAnalytics?.setLeadIdentity(ctx.contact, {
      lead_type: ctx.analytics.lead_type,
      lead_tier: ctx.analytics.lead_tier,
      property_count_bucket: ctx.analytics.property_count_bucket,
    });

    window.LocPilotAnalytics?.track('audit_form_submit', {
      event_category: 'lead',
      event_label: actionIntent,
      ...ctx.analytics,
    });

    window.LocPilotAnalytics?.track('whatsapp_click', {
      event_category: 'lead',
      event_label: actionIntent,
      destination: 'whatsapp',
      ...ctx.analytics,
    }, {
      metaEventName: actionIntent === 'priority_callback' ? 'Contact' : 'Lead',
      metaParams: {
        content_name: actionIntent === 'priority_callback' ? 'Rappel prioritaire LocPilot' : 'Audit LocPilot',
        content_category: 'lead_generation',
        value: ctx.analytics.estimated_monthly_value || 1,
        currency: 'EUR',
        status: ctx.analytics.lead_tier,
      },
    });

    const encoded = encodeURIComponent(buildMessage(ctx));
    const url = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  primaryBtn.addEventListener('click', () => openWhatsapp('whatsapp_audit'));
  if (callbackBtn) callbackBtn.addEventListener('click', () => openWhatsapp('priority_callback'));
}

function initGenericTracking() {
  if (document.body.dataset.trackingBound === 'true') return;
  document.body.dataset.trackingBound = 'true';

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a, button');
    if (!link) return;

    if (link.matches('a[href^="mailto:"]')) {
      window.LocPilotAnalytics?.track('email_click', {
        event_category: 'contact',
        event_label: link.getAttribute('href').replace('mailto:', ''),
      });
    }

    if (link.matches('a[href^="tel:"]')) {
      window.LocPilotAnalytics?.track('phone_click', {
        event_category: 'contact',
        event_label: link.getAttribute('href').replace('tel:', ''),
      });
    }

    if (link.getAttribute('href') === '#roi' || link.closest('[href="#roi"]')) {
      window.LocPilotAnalytics?.track('roi_simulation_click', {
        interaction_type: 'cta',
        event_category: 'engagement',
      });
    }

    const pricingCard = link.closest('.price-card');
    if (pricingCard) {
      const packageName = pricingCard.querySelector('.name')?.textContent?.trim().toLowerCase() || 'unknown';
      window.LocPilotAnalytics?.track('pricing_cta_click', {
        event_category: 'pricing',
        package_name: packageName,
      });
    }
  }, { passive: true });
}

function initScrollTracking() {
  if (window.__locpilotScrollTrackingBound) return;
  window.__locpilotScrollTrackingBound = true;
  let fired = false;

  const handler = () => {
    if (fired) return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollHeight = doc.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const progress = (scrollTop / scrollHeight) * 100;
    if (progress >= 75) {
      fired = true;
      window.LocPilotAnalytics?.track('scroll_75', {
        event_category: 'engagement',
        percent_scrolled: 75,
      });
      window.removeEventListener('scroll', handler);
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
}

function initPricingViewTracking() {
  const pricing = document.getElementById('pricing');
  if (!pricing || pricing.dataset.trackingBound === 'true') return;
  pricing.dataset.trackingBound = 'true';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      window.LocPilotAnalytics?.track('pricing_view', {
        event_category: 'pricing',
        section: 'pricing',
      });
      observer.disconnect();
    });
  }, { threshold: 0.45 });

  observer.observe(pricing);
}


function initCookieManager() {
  const root = document.body;
  if (!root || root.dataset.cookieManagerBound === 'true') return;
  root.dataset.cookieManagerBound = 'true';

  const config = window.LocPilotTrackingConfig || {};
  const consentKey = 'locpilot-cookie-consent';
  const consentVersion = config.consentVersion || 'default';
  const lifetimeDays = Number(config.cookieLifetimeDays || 183);

  const banner = document.getElementById('cookieBanner');
  const panel = document.getElementById('cookiePanel');
  const analyticsToggle = document.getElementById('cookieAnalytics');
  const marketingToggle = document.getElementById('cookieMarketing');
  const acceptBannerBtn = document.getElementById('cookieBannerAccept');
  const rejectBannerBtn = document.getElementById('cookieBannerReject');
  const customizeBannerBtn = document.getElementById('cookieBannerCustomize');
  const acceptAllBtn = document.getElementById('cookieAcceptAll');
  const rejectAllBtn = document.getElementById('cookieRejectAll');
  const saveChoicesBtn = document.getElementById('cookieSaveChoices');
  const closeTargets = Array.from(document.querySelectorAll('[data-cookie-close]'));
  const openLinks = Array.from(document.querySelectorAll('#openCookieManager, [data-open-cookie-manager], a[href="#gestion-cookies"]'));

  if (!banner || !panel) return;

  const storage = {
    get() {
      try {
        return window.localStorage.getItem(consentKey);
      } catch (error) {
        return null;
      }
    },
    set(value) {
      try {
        window.localStorage.setItem(consentKey, value);
      } catch (error) {
        /* ignore storage issues */
      }
    },
    remove() {
      try {
        window.localStorage.removeItem(consentKey);
      } catch (error) {
        /* ignore storage issues */
      }
    }
  };

  function readCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function writeCookie(value, expiresAt) {
    const expiryDate = new Date(expiresAt || (Date.now() + (lifetimeDays * 24 * 60 * 60 * 1000)));
    document.cookie = `${consentKey}=${encodeURIComponent(value)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  }

  function clearCookie() {
    document.cookie = `${consentKey}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  function parseConsent(rawValue) {
    if (!rawValue) return null;
    try {
      const parsed = JSON.parse(rawValue);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.version !== consentVersion) return null;
      if (!parsed.expiresAt || Number.isNaN(Date.parse(parsed.expiresAt))) return null;
      if (Date.parse(parsed.expiresAt) <= Date.now()) return null;
      return {
        necessary: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true,
        version: parsed.version,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        expiresAt: parsed.expiresAt,
      };
    } catch (error) {
      return null;
    }
  }

  function getStoredConsent() {
    const localValue = parseConsent(storage.get());
    if (localValue) return localValue;
    const cookieValue = parseConsent(readCookie(consentKey));
    if (cookieValue) {
      persistConsent(cookieValue);
      return cookieValue;
    }
    storage.remove();
    clearCookie();
    return null;
  }

  function persistConsent(consent) {
    const expiresAt = consent.expiresAt || new Date(Date.now() + (lifetimeDays * 24 * 60 * 60 * 1000)).toISOString();
    const normalized = {
      necessary: true,
      analytics: consent.analytics === true,
      marketing: consent.marketing === true,
      version: consentVersion,
      updatedAt: new Date().toISOString(),
      expiresAt,
    };
    const serialized = JSON.stringify(normalized);
    storage.set(serialized);
    writeCookie(serialized, expiresAt);
    return normalized;
  }

  function syncToggles(consent) {
    if (analyticsToggle) analyticsToggle.checked = consent?.analytics === true;
    if (marketingToggle) marketingToggle.checked = consent?.marketing === true;
  }

  function setOpenLinksExpanded(expanded) {
    openLinks.forEach((link) => link.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
  }

  function showBanner() {
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
  }

  function hideBanner() {
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
  }

  function openPanel() {
    hideBanner();
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cookie-panel-open');
    setOpenLinksExpanded(true);
  }

  function closePanel() {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cookie-panel-open');
    setOpenLinksExpanded(false);
  }

  function dispatchConsent(consent) {
    window.LocPilotCookieConsent = consent;
    document.documentElement.dataset.cookieAnalytics = consent.analytics ? 'granted' : 'denied';
    document.documentElement.dataset.cookieMarketing = consent.marketing ? 'granted' : 'denied';
    window.dispatchEvent(new CustomEvent('locpilot:consent-updated', {
      detail: {
        analytics: consent.analytics,
        marketing: consent.marketing,
        necessary: true,
        version: consent.version,
      }
    }));
  }

  function applyConsent(nextConsent, options = {}) {
    const shouldPersist = options.persist !== false;
    const consent = shouldPersist ? persistConsent(nextConsent) : {
      necessary: true,
      analytics: nextConsent.analytics === true,
      marketing: nextConsent.marketing === true,
      version: consentVersion,
      updatedAt: nextConsent.updatedAt || new Date().toISOString(),
      expiresAt: nextConsent.expiresAt || new Date(Date.now() + (lifetimeDays * 24 * 60 * 60 * 1000)).toISOString(),
    };

    syncToggles(consent);
    dispatchConsent(consent);
    hideBanner();
    closePanel();
    return consent;
  }

  function openManagerFromFooter() {
    const stored = getStoredConsent();
    if (!stored) showBanner();
    syncToggles(stored || { analytics: false, marketing: false });
    openPanel();
  }

  const initialConsent = getStoredConsent();
  if (initialConsent) {
    syncToggles(initialConsent);
    dispatchConsent(initialConsent);
    hideBanner();
  } else {
    syncToggles({ analytics: false, marketing: false });
    window.requestAnimationFrame(() => {
      showBanner();
    });
  }

  acceptBannerBtn?.addEventListener('click', () => {
    applyConsent({ analytics: true, marketing: true });
  });

  rejectBannerBtn?.addEventListener('click', () => {
    applyConsent({ analytics: false, marketing: false });
  });

  customizeBannerBtn?.addEventListener('click', () => {
    syncToggles(getStoredConsent() || { analytics: false, marketing: false });
    openPanel();
  });

  acceptAllBtn?.addEventListener('click', () => {
    applyConsent({ analytics: true, marketing: true });
  });

  rejectAllBtn?.addEventListener('click', () => {
    applyConsent({ analytics: false, marketing: false });
  });

  saveChoicesBtn?.addEventListener('click', () => {
    applyConsent({
      analytics: analyticsToggle?.checked === true,
      marketing: marketingToggle?.checked === true,
    });
  });

  closeTargets.forEach((target) => {
    target.addEventListener('click', () => {
      closePanel();
      if (!getStoredConsent()) showBanner();
    });
  });

  openLinks.forEach((link) => {
    if (link.dataset.cookieManagerBound === 'true') return;
    link.dataset.cookieManagerBound = 'true';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openManagerFromFooter();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!panel.hidden) {
      closePanel();
      if (!getStoredConsent()) showBanner();
    }
  });

  if (window.location.hash === '#gestion-cookies') {
    window.requestAnimationFrame(() => {
      openManagerFromFooter();
    });
  }

  window.LocPilotCookieManager = {
    getConsent: getStoredConsent,
    showBanner,
    hideBanner,
    openPanel: openManagerFromFooter,
    closePanel,
    acceptAll() {
      applyConsent({ analytics: true, marketing: true });
    },
    rejectAll() {
      applyConsent({ analytics: false, marketing: false });
    }
  };
}



function initImmersionExperience() {
  const section = document.getElementById('immersion');
  if (!section || section.dataset.fullImmersionBound === 'true') return;
  section.dataset.fullImmersionBound = 'true';

  const panoTriggers = Array.from(section.querySelectorAll('.js-pano-trigger'));
  const inlinePanoTriggers = panoTriggers.filter((trigger) => trigger.dataset.inlinePsv === 'true');
  const imageTriggers = Array.from(section.querySelectorAll('.js-image-modal-trigger'));
  const panoModal = document.getElementById('immersionPanoModal');
  const panoDialog = panoModal?.querySelector('.immersion-v24-modal__dialog') || null;
  const panoViewport = document.getElementById('modalPanoViewport');
  const panoTitle = document.getElementById('immersionPanoModalTitle');
  const panoCaption = document.getElementById('immersionPanoModalCaption');
  const panoHint = panoModal?.querySelector('.immersion-v24-modal__hint') || null;
  const panoCloseTargets = panoModal ? panoModal.querySelectorAll('[data-close-pano-modal]') : [];
  const panoZoomIn = document.getElementById('panoZoomIn');
  const panoZoomOut = document.getElementById('panoZoomOut');
  const panoResetView = document.getElementById('panoResetView');
  const panoMobileResetView = document.getElementById('panoMobileResetView');
  const panoGyroToggle = document.getElementById('panoGyroToggle');
  const panoMobileGyroToggle = document.getElementById('panoMobileGyroToggle');
  const panoFullscreenToggle = document.getElementById('panoFullscreenToggle');
  const sceneButtons = Array.from(section.querySelectorAll('[data-scene-trigger]'));
  const imageModal = document.getElementById('immersionImageModal');
  const imageModalImg = document.getElementById('immersionImageModalImg');
  const imageCloseTargets = imageModal ? imageModal.querySelectorAll('[data-close-image-modal]') : [];
  const panoModalOpenButtons = Array.from(section.querySelectorAll('.js-open-pano-modal'));

  if (!panoTriggers.length || !panoModal || !panoViewport) return;

  const getBridge = () => window.LocPilotPsvBridge;
  const waitForBridgeReady = (timeout = 7000) => new Promise((resolve) => {
    const bridge = getBridge();
    if (bridge?.isReady?.()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const stop = () => {
      window.removeEventListener('locpilot:psv-ready', onReady);
      clearInterval(intervalId);
    };
    const finish = (value) => {
      stop();
      resolve(value);
    };
    const onReady = () => finish(true);
    const intervalId = window.setInterval(() => {
      if (getBridge()?.isReady?.()) {
        finish(true);
        return;
      }
      if ((Date.now() - startTime) >= timeout) {
        finish(false);
      }
    }, 120);

    window.addEventListener('locpilot:psv-ready', onReady, { once: true });
  });

  const sceneMap = new Map();
  panoTriggers.forEach((trigger) => {
    const sceneId = trigger.dataset.panoId;
    if (sceneId && !sceneMap.has(sceneId)) sceneMap.set(sceneId, trigger);

    const inlineViewport = trigger.querySelector('.js-pano-viewport');
    if (inlineViewport && trigger.dataset.panoSrc) {
      inlineViewport.style.backgroundImage = `url("${trigger.dataset.panoSrc}")`;
      inlineViewport.style.backgroundRepeat = 'repeat-x';
      inlineViewport.style.backgroundSize = 'auto 100%';
      inlineViewport.style.backgroundPosition = 'center center';
      inlineViewport.classList.add('is-ready');
    }

    const panoCardImage = trigger.querySelector('.immersion-v25-media-card__visual > img');
    if (panoCardImage) {
      panoCardImage.loading = 'eager';
      panoCardImage.decoding = 'async';
    }
  });

  let currentTrigger = panoTriggers[0] || null;

  const isMobileImmersive = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;

  function updateHint() {
    if (!panoHint) return;
    panoHint.textContent = isMobileImmersive()
      ? 'Glissez pour regarder • Pincez pour zoomer • Recentrage via le bouton • Gyroscope disponible sur HTTPS'
      : 'Cliquez-glissez pour regarder • Molette ou boutons pour zoomer • Recentrage via le bouton';
  }

  function syncSceneButtons(activeSceneId) {
    sceneButtons.forEach((button) => {
      const isActive = button.dataset.sceneTrigger === activeSceneId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function syncGyroLabels() {
    const bridge = getBridge();
    const active = bridge?.isGyroscopeEnabled?.() === true;
    const label = active ? 'Gyroscope actif' : 'Gyroscope';
    if (panoGyroToggle) panoGyroToggle.textContent = label;
    if (panoMobileGyroToggle) panoMobileGyroToggle.textContent = label;
  }

  function numericAttr(trigger, attr, fallback) {
    const value = trigger?.dataset?.[attr];
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function getSceneConfig(trigger) {
    const modalYaw = numericAttr(panoViewport, 'startYaw', 0.5);
    const modalPitch = numericAttr(panoViewport, 'startPitch', 0.5);
    const modalZoom = numericAttr(panoViewport, 'startZoom', 1.1);
    return {
      src: trigger?.dataset?.panoSrc || '',
      yaw: trigger?.dataset?.psvYaw || `${(((numericAttr(trigger, 'startYaw', modalYaw) * 360) - 180)).toFixed(2)}deg`,
      pitch: trigger?.dataset?.psvPitch || `${(((0.5 - numericAttr(trigger, 'startPitch', modalPitch)) * 180)).toFixed(2)}deg`,
      zoom: Number.isFinite(Number(trigger?.dataset?.psvZoom))
        ? Number(trigger.dataset.psvZoom)
        : Math.max(20, Math.min(90, Math.round(42 + ((numericAttr(trigger, 'startZoom', modalZoom) - 1) * 26)))),
    };
  }

  function isPanoFullscreenActive() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || null;
    return !!fullscreenElement && (!!panoDialog?.contains(fullscreenElement) || fullscreenElement === panoDialog || fullscreenElement === panoModal || fullscreenElement === panoViewport);
  }

  function syncFullscreenButton() {
    const active = isPanoFullscreenActive();
    panoModal.classList.toggle('is-native-fullscreen', active);
    if (panoFullscreenToggle) panoFullscreenToggle.textContent = active ? 'Quitter plein écran' : 'Plein écran';
  }

  async function requestFullscreen() {
    const target = isMobileImmersive() ? (panoModal || panoDialog || panoViewport) : (panoDialog || panoViewport);
    const request = target?.requestFullscreen || target?.webkitRequestFullscreen || target?.msRequestFullscreen;
    if (!request || isPanoFullscreenActive()) return;
    try {
      await request.call(target);
    } catch (error) {
      console.warn('[locpilot] fullscreen request refused', error);
    }
    syncFullscreenButton();
  }

  async function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!exit || !isPanoFullscreenActive()) return;
    try {
      await exit.call(document);
    } catch (error) {
      console.warn('[locpilot] fullscreen exit refused', error);
    }
    syncFullscreenButton();
  }

  async function ensureBridgeReady(trigger = null) {
    let bridge = getBridge();
    if (bridge?.isReady?.()) return bridge;

    if (trigger?.dataset?.panoSrc) {
      panoViewport.style.backgroundImage = `url("${trigger.dataset.panoSrc}")`;
      panoViewport.style.backgroundRepeat = 'repeat-x';
      panoViewport.style.backgroundSize = 'auto 100%';
      panoViewport.style.backgroundPosition = 'center center';
    }

    if (panoHint) {
      panoHint.textContent = 'Chargement de la visite 360…';
    }

    const ready = await waitForBridgeReady();
    updateHint();
    bridge = getBridge();
    return ready && bridge?.isReady?.() ? bridge : null;
  }

  async function mountInlineViewer(trigger) {
    const inlineViewport = trigger?.querySelector('.js-pano-viewport');
    if (!trigger || !inlineViewport) return false;
    if (inlineViewport.dataset.psvMounted === 'true') return true;

    const bridge = await ensureBridgeReady();
    if (!bridge?.isReady?.()) return false;

    const scene = getSceneConfig(trigger);

    try {
      await bridge.open({
        container: inlineViewport,
        src: scene.src,
        yaw: scene.yaw,
        pitch: scene.pitch,
        zoom: scene.zoom,
        autorotate: true,
        autorotateSpeed: Number.isFinite(Number(trigger.dataset.psvAutorotateSpeed)) ? Number(trigger.dataset.psvAutorotateSpeed) : 2.4,
        autorotateIdleDelay: Number.isFinite(Number(trigger.dataset.psvAutorotateDelay)) ? Number(trigger.dataset.psvAutorotateDelay) : 1800,
      });
      bridge.resize?.(inlineViewport);
      inlineViewport.classList.add('is-ready');
      inlineViewport.dataset.psvMounted = 'true';

      if (trigger.dataset.inlineTracked !== 'true') {
        trigger.dataset.inlineTracked = 'true';
        window.LocPilotAnalytics?.track('immersive_scene_view', {
          event_category: 'immersion',
          scene_name: `${trigger.dataset.panoId || 'scene'}_inline`,
          scene_type: 'pano_inline',
          viewer_engine: 'photo_sphere_viewer'
        });
      }
      return true;
    } catch (error) {
      console.error('[locpilot] unable to mount inline PSV scene', error);
      inlineViewport.removeAttribute('data-psv-active');
      inlineViewport.dataset.psvMounted = 'false';
      inlineViewport.style.backgroundImage = scene.src ? `url("${scene.src}")` : '';
      inlineViewport.style.backgroundRepeat = 'repeat-x';
      inlineViewport.style.backgroundSize = 'auto 100%';
      inlineViewport.style.backgroundPosition = 'center center';
      return false;
    }
  }

  async function openPanoModal(trigger, options = {}) {
    if (!trigger) return;
    currentTrigger = trigger;

    const sceneId = trigger.dataset.panoId || 'scene';

    if (panoTitle) panoTitle.textContent = trigger.dataset.panoTitle || 'Visite 360';
    if (panoCaption) panoCaption.textContent = trigger.dataset.panoCaption || 'Explorez le bien en plein écran, à la souris ou au smartphone.';

    panoModal.hidden = false;
    panoModal.setAttribute('aria-hidden', 'false');
    panoModal.classList.toggle('is-mobile-immersive', isMobileImmersive());
    document.body.classList.add('immersion-modal-open');

    updateHint();
    syncSceneButtons(sceneId);
    syncGyroLabels();

    const bridge = await ensureBridgeReady(trigger);
    if (!bridge?.isReady?.()) {
      if (panoCaption) {
        panoCaption.textContent = 'Le viewer 360 ne s’est pas chargé correctement. Recharge la page et réessaie.';
      }
      console.warn('[locpilot] Photo Sphere Viewer bridge unavailable');
      return;
    }

    const scene = getSceneConfig(trigger);

    try {
      await bridge.open({
        container: panoViewport,
        src: scene.src,
        yaw: scene.yaw,
        pitch: scene.pitch,
        zoom: scene.zoom,
        autorotate: false,
      });
      bridge.resize?.(panoViewport);
      syncGyroLabels();

      if (options.autoFullscreen && isMobileImmersive()) {
        await requestFullscreen();
      }

      window.LocPilotAnalytics?.track('immersive_scene_view', {
        event_category: 'immersion',
        scene_name: sceneId,
        scene_type: 'pano',
        viewer_engine: 'photo_sphere_viewer'
      });
    } catch (error) {
      console.error('[locpilot] unable to open PSV scene', error);
      panoViewport.removeAttribute('data-psv-active');
      panoViewport.style.backgroundImage = scene.src ? `url("${scene.src}")` : '';
      panoViewport.style.backgroundRepeat = 'repeat-x';
      panoViewport.style.backgroundSize = 'auto 100%';
      panoViewport.style.backgroundPosition = 'center center';
      if (panoCaption) {
        panoCaption.textContent = 'La scène 360 n’a pas pu s’ouvrir correctement. Recharge la page et réessaie.';
      }
    }
  }

  async function closePanoModal() {
    const bridge = getBridge();
    bridge?.disableGyroscope?.();
    syncGyroLabels();
    await exitFullscreen();
    panoModal.hidden = true;
    panoModal.setAttribute('aria-hidden', 'true');
    panoModal.classList.remove('is-mobile-immersive');
    document.body.classList.remove('immersion-modal-open');
  }

  async function toggleGyroscope() {
    const bridge = getBridge();
    if (!bridge?.isReady?.()) {
      window.alert('Le viewer 360 est encore en cours de chargement.');
      return;
    }
    try {
      await bridge.toggleGyroscope?.(panoViewport);
    } catch (error) {
      window.alert('Le gyroscope nécessite un site en HTTPS et peut demander une autorisation navigateur.');
    }
    syncGyroLabels();
  }

  function openImageModal(trigger) {
    if (!imageModal || !imageModalImg) return;
    imageModalImg.src = trigger.dataset.imageSrc || '';
    imageModalImg.alt = trigger.dataset.imageAlt || '';
    imageModal.hidden = false;
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('immersion-modal-open');

    window.LocPilotAnalytics?.track('immersive_scene_view', {
      event_category: 'immersion',
      scene_name: 'drone_environnement',
      scene_type: 'image'
    });
  }

  function closeImageModal() {
    if (!imageModal || !imageModalImg) return;
    imageModal.hidden = true;
    imageModal.setAttribute('aria-hidden', 'true');
    imageModalImg.src = '';
    imageModalImg.alt = '';
    document.body.classList.remove('immersion-modal-open');
  }

  panoTriggers.forEach((trigger) => {
    if (trigger.dataset.psvBound === 'true') return;
    trigger.dataset.psvBound = 'true';

    if (trigger.dataset.inlinePsv === 'true') {
      return;
    }

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPanoModal(trigger, { autoFullscreen: true });
    });
  });

  panoModalOpenButtons.forEach((button) => {
    if (button.dataset.inlineModalBound === 'true') return;
    button.dataset.inlineModalBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const targetScene = button.dataset.targetScene || 'rooftop';
      const trigger = sceneMap.get(targetScene);
      if (trigger) openPanoModal(trigger, { autoFullscreen: true });
    });
  });

  panoCloseTargets.forEach((target) => target.addEventListener('click', closePanoModal));
  imageCloseTargets.forEach((target) => target.addEventListener('click', closeImageModal));
  imageTriggers.forEach((trigger) => {
    if (trigger.dataset.imageModalBound === 'true') return;
    trigger.dataset.imageModalBound = 'true';
    trigger.addEventListener('click', () => openImageModal(trigger));
  });

  sceneButtons.forEach((button) => {
    if (button.dataset.sceneBound === 'true') return;
    button.dataset.sceneBound = 'true';
    button.addEventListener('click', () => {
      const trigger = sceneMap.get(button.dataset.sceneTrigger || '');
      if (trigger) openPanoModal(trigger);
    });
  });

  panoZoomIn?.addEventListener('click', () => getBridge()?.zoomIn?.(12, panoViewport));
  panoZoomOut?.addEventListener('click', () => getBridge()?.zoomOut?.(12, panoViewport));
  panoResetView?.addEventListener('click', () => getBridge()?.resetView?.(panoViewport));
  panoMobileResetView?.addEventListener('click', () => getBridge()?.resetView?.(panoViewport));
  panoGyroToggle?.addEventListener('click', toggleGyroscope);
  panoMobileGyroToggle?.addEventListener('click', toggleGyroscope);

  panoFullscreenToggle?.addEventListener('click', async () => {
    if (isPanoFullscreenActive()) {
      await exitFullscreen();
      return;
    }
    await requestFullscreen();
  });

  document.addEventListener('fullscreenchange', syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
  window.addEventListener('resize', () => {
    panoModal.classList.toggle('is-mobile-immersive', isMobileImmersive());
    updateHint();
    getBridge()?.resize?.();
    syncFullscreenButton();
  }, { passive: true });

  window.addEventListener('locpilot:psv-ready', () => {
    updateHint();
    syncGyroLabels();
    getBridge()?.resize?.();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!panoModal.hidden) closePanoModal();
    if (imageModal && !imageModal.hidden) closeImageModal();
  });

  inlinePanoTriggers.forEach((trigger) => {
    const inlineViewport = trigger.querySelector('.js-pano-viewport');
    if (!inlineViewport) return;

    const inlineObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        mountInlineViewer(trigger);
        observer.disconnect();
      });
    }, { threshold: 0.2, rootMargin: '120px 0px' });

    inlineObserver.observe(inlineViewport);

    if (inlineViewport.getBoundingClientRect().top < (window.innerHeight * 1.2)) {
      window.requestAnimationFrame(() => {
        mountInlineViewer(trigger);
      });
    }
  });

  updateHint();
  syncGyroLabels();
  syncFullscreenButton();
}
