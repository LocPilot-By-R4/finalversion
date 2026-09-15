(() => {
  'use strict';

  const API_BASE =
    'https://api.locpilotbyr4.fr/api/v1';

  const SEARCH_ENDPOINT =
    `${API_BASE}/search`;

  const script =
    document.querySelector(
      'script[src$="js/accommodation-search.js"]'
    );

  const fallbackImage = new URL(
    '../images/platform/og-platform.jpg',
    script?.src || window.location.href
  ).href;

  const params =
    new URLSearchParams(
      window.location.search
    );

  const resultsPlaceholder =
    document.querySelector(
      '.results-empty'
    );

  if (!resultsPlaceholder) {
    return;
  }

  function parseInteger(
    value,
    fallback,
    min,
    max
  ) {
    const parsed =
      Number.parseInt(value, 10);

    if (
      !Number.isInteger(parsed) ||
      parsed < min ||
      parsed > max
    ) {
      return fallback;
    }

    return parsed;
  }

  function getSearchCriteria() {
    return {
      destination:
        params.get('destination')
          ?.trim() || '',

      arrival:
        params.get('arrival') || '',

      departure:
        params.get('departure') || '',

      adults:
        parseInteger(
          params.get('adults'),
          2,
          1,
          20
        ),

      children:
        parseInteger(
          params.get('children'),
          0,
          0,
          20
        )
    };
  }

  function createElement(
    tag,
    className,
    text
  ) {
    const element =
      document.createElement(tag);

    if (className) {
      element.className =
        className;
    }

    if (text !== undefined) {
      element.textContent =
        String(text);
    }

    return element;
  }

  function formatPrice(value) {
    const price =
      Number(value);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return 'Tarif sur demande';
    }

    return new Intl.NumberFormat(
      'fr-FR',
      {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }
    ).format(price);
  }

  function formatLocation(product) {
    const parts = [
      product.city,
      product.country
    ].filter(Boolean);

    return parts.join(' · ');
  }

  function createResultsRoot() {
    const root =
      createElement(
        'section',
        'lp-search-results'
      );

    root.id =
      'accommodationResults';

    root.setAttribute(
      'aria-live',
      'polite'
    );

    resultsPlaceholder.replaceWith(
      root
    );

    return root;
  }

  const resultsRoot =
    createResultsRoot();

  function renderMessage(
    title,
    message,
    type = ''
  ) {
    resultsRoot.replaceChildren();

    const box =
      createElement(
        'div',
        `lp-results-message${
          type
            ? ` lp-results-message--${type}`
            : ''
        }`
      );

    const heading =
      createElement(
        'strong',
        '',
        title
      );

    const description =
      createElement(
        'p',
        '',
        message
      );

    box.append(
      heading,
      description
    );

    resultsRoot.append(box);
  }

  function renderLoading() {
    renderMessage(
      'Recherche en cours…',
      'Nous vérifions les disponibilités correspondant à votre séjour.',
      'loading'
    );
  }

  function createCard(product) {
    const article =
      createElement(
        'article',
        'lp-property-card'
      );

    const media =
      createElement(
        'div',
        'lp-property-card__media'
      );

    const image =
      document.createElement('img');

    image.src =
      product.image ||
      fallbackImage;

    image.alt =
      product.name
        ? `Photo de ${product.name}`
        : 'Hébergement';

    image.loading = 'lazy';
    image.decoding = 'async';

    image.addEventListener(
      'error',
      () => {
        if (
          image.src !==
          fallbackImage
        ) {
          image.src =
            fallbackImage;
        }
      },
      {
        once: true
      }
    );

    media.append(image);

    if (product.hasPromotion) {
      const promotion =
        createElement(
          'span',
          'lp-property-card__promotion',
          'Offre spéciale'
        );

      media.append(promotion);
    }

    const body =
      createElement(
        'div',
        'lp-property-card__body'
      );

    const meta =
      createElement(
        'div',
        'lp-property-card__meta'
      );

    if (product.type) {
      meta.append(
        createElement(
          'span',
          '',
          product.type
        )
      );
    }

    const location =
      formatLocation(product);

    if (location) {
      meta.append(
        createElement(
          'span',
          '',
          location
        )
      );
    }

    const title =
      createElement(
        'h3',
        'lp-property-card__title',
        product.name ||
          'Hébergement'
      );

    const footer =
      createElement(
        'div',
        'lp-property-card__footer'
      );

    const priceBlock =
      createElement(
        'div',
        'lp-property-card__price'
      );

    const price =
      createElement(
        'strong',
        '',
        formatPrice(
          product.priceFrom
        )
      );

    priceBlock.append(price);

    if (
      Number(product.priceFrom) > 0
    ) {
      priceBlock.append(
        createElement(
          'small',
          '',
          'à partir de'
        )
      );
    }

    if (
      Number.isInteger(
        product.minimumStay
      ) &&
      product.minimumStay > 1
    ) {
      priceBlock.append(
        createElement(
          'small',
          '',
          `${product.minimumStay} nuits minimum`
        )
      );
    }

    const button =
      createElement(
        'button',
        'lp-property-card__action',
        'Voir les disponibilités'
      );

    button.type = 'button';

    button.addEventListener(
      'click',
      () => {
        openProduct(
          product,
          button
        );
      }
    );

    footer.append(
      priceBlock,
      button
    );

    body.append(
      meta,
      title,
      footer
    );

    article.append(
      media,
      body
    );

    return article;
  }

  function renderResults(
    products,
    criteria
  ) {
    resultsRoot.replaceChildren();

    const header =
      createElement(
        'div',
        'lp-results-header'
      );

    const title =
      createElement(
        'h2',
        '',
        products.length === 1
          ? '1 hébergement disponible'
          : `${products.length} hébergements disponibles`
      );

    const summaryParts = [];

    if (criteria.destination) {
      summaryParts.push(
        criteria.destination
      );
    }

    if (
      criteria.arrival &&
      criteria.departure
    ) {
      summaryParts.push(
        `${criteria.arrival} → ${criteria.departure}`
      );
    }

    const totalTravellers =
      criteria.adults +
      criteria.children;

    summaryParts.push(
      `${totalTravellers} voyageur${
        totalTravellers > 1
          ? 's'
          : ''
      }`
    );

    const summary =
      createElement(
        'p',
        '',
        summaryParts.join(' · ')
      );

    header.append(
      title,
      summary
    );

    const grid =
      createElement(
        'div',
        'lp-results-grid'
      );

    for (
      const product
      of products
    ) {
      grid.append(
        createCard(product)
      );
    }

    resultsRoot.append(
      header,
      grid
    );
  }

  async function requestJson(
    url,
    options
  ) {
    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        () => controller.abort(),
        20000
      );

    try {
      const response =
        await fetch(
          url,
          {
            ...options,
            signal:
              controller.signal
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.details?.[0] ||
          'La requête a échoué.';

        throw new Error(
          message
        );
      }

      return data;
    } finally {
      window.clearTimeout(
        timeout
      );
    }
  }

  async function openProduct(
    product,
    button
  ) {
    const criteria =
      getSearchCriteria();

    if (
      !criteria.arrival ||
      !criteria.departure
    ) {
      return;
    }

    const originalText =
      button.textContent;

    button.disabled = true;
    button.textContent =
      'Vérification…';

    const payload = {
      StartDate:
        criteria.arrival,

      EndDate:
        criteria.departure,

      AdultNumber:
        criteria.adults,

      ChildNumber:
        criteria.children
    };

    try {
      const detail =
        await requestJson(
          `${API_BASE}/products/${encodeURIComponent(
            product.id
          )}/availability`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify(
                payload
              )
          }
        );

      if (detail?.bookingUrl) {
        window.location.assign(
          detail.bookingUrl
        );

        return;
      }

      button.textContent =
        'Réservation indisponible';
    } catch (error) {
      console.error(
        'LocPilot product error:',
        error
      );

      button.textContent =
        'Réessayer';

      button.disabled = false;

      return;
    }

    window.setTimeout(
      () => {
        button.textContent =
          originalText;

        button.disabled = false;
      },
      2500
    );
  }

  async function runSearch() {
    const criteria =
      getSearchCriteria();

    if (
      !criteria.arrival ||
      !criteria.departure
    ) {
      renderMessage(
        'Sélectionnez vos dates',
        'Indiquez une date d’arrivée et une date de départ pour afficher les disponibilités en temps réel.'
      );

      return;
    }

    const payload = {
      StartDate:
        criteria.arrival,

      EndDate:
        criteria.departure,

      AdultNumber:
        criteria.adults,

      ChildNumber:
        criteria.children
    };

    if (criteria.destination) {
      payload.Destination =
        criteria.destination;
    }

    renderLoading();

    try {
      const data =
        await requestJson(
          SEARCH_ENDPOINT,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify(
                payload
              )
          }
        );

      const products =
        Array.isArray(
          data?.results
        )
          ? data.results
          : [];

      if (
        products.length === 0
      ) {
        renderMessage(
          'Aucun hébergement disponible',
          criteria.destination
            ? `Aucune disponibilité n’a été trouvée à ${criteria.destination} pour ces dates.`
            : 'Aucune disponibilité n’a été trouvée pour ces dates.',
          'empty'
        );

        return;
      }

      renderResults(
        products,
        criteria
      );
    } catch (error) {
      console.error(
        'LocPilot search error:',
        error
      );

      const isTimeout =
        error?.name ===
        'AbortError';

      renderMessage(
        'Recherche temporairement indisponible',
        isTimeout
          ? 'La recherche a pris trop de temps. Vous pouvez réessayer dans quelques instants.'
          : 'Nous n’avons pas pu récupérer les disponibilités. Merci de réessayer dans quelques instants.',
        'error'
      );
    }
  }

  runSearch();
})();
