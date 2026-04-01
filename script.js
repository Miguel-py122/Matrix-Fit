(() => {
  const yearEl = document.getElementById('ano');
  const pricingModeButtons = Array.from(document.querySelectorAll('[data-pricing-mode]'));
  const pricingSections = Array.from(document.querySelectorAll('[data-pricing-section]'));

  function applyImageFallbacks() {
    const imgs = Array.from(document.querySelectorAll('img[data-fallback]'));
    imgs.forEach((img) => {
      const fallback = img.getAttribute('data-fallback');
      if (!fallback) return;

      img.addEventListener(
        'error',
        () => {
          const current = img.getAttribute('src') || '';
          if (current.endsWith(fallback)) return;
          img.setAttribute('src', fallback);
        },
        { once: true },
      );
    });
  }

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function setPricingMode(mode) {
    pricingModeButtons.forEach((button) => {
      const isActive = button.dataset.pricingMode === mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    pricingSections.forEach((section) => {
      const isActive = section.dataset.pricingSection === mode;
      if (isActive) section.removeAttribute('hidden');
      else section.setAttribute('hidden', '');
    });
  }

  pricingModeButtons.forEach((button) => {
    button.addEventListener('click', () => setPricingMode(button.dataset.pricingMode || 'mensal'));
  });

  function initPlanCarousels() {
    const carousels = Array.from(document.querySelectorAll('.plan-carousel'));
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const cards = Array.from(carousel.querySelectorAll('.pricing-cards--variants .pricing-card'));
      if (!cards.length) return;

      let currentIndex = 0;
      const dots = document.createElement('div');
      dots.className = 'plan-carousel__dots';

      const dotButtons = cards.map((card, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'plan-carousel__dot';
        button.setAttribute('aria-label', `Ir para ${card.querySelector('.pricing-card__plan')?.textContent || `plano ${index + 1}`}`);
        button.addEventListener('click', () => {
          currentIndex = index;
          render();
        });
        dots.appendChild(button);
        return button;
      });

      carousel.appendChild(dots);

      const render = () => {
        const total = cards.length;
        const prevIndex = (currentIndex - 1 + total) % total;
        const nextIndex = (currentIndex + 1) % total;

        cards.forEach((card, index) => {
          card.classList.remove('is-current', 'is-prev', 'is-next', 'is-hidden');

          if (index === currentIndex) card.classList.add('is-current');
          else if (index === prevIndex) card.classList.add('is-prev');
          else if (index === nextIndex) card.classList.add('is-next');
          else card.classList.add('is-hidden');

          dotButtons[index]?.classList.toggle('is-active', index === currentIndex);
        });
      };

      carousel.querySelector('.plan-carousel__arrow--prev')?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        render();
      });
      carousel.querySelector('.plan-carousel__arrow--next')?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % cards.length;
        render();
      });
      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          const hoveredIndex = cards.indexOf(card);
          if (hoveredIndex >= 0) {
            currentIndex = hoveredIndex;
            render();
          }
        });
        card.addEventListener('click', () => {
          const clickedIndex = cards.indexOf(card);
          if (clickedIndex >= 0) {
            currentIndex = clickedIndex;
            render();
          }
        });
      });

      render();
    });
  }

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const go = btn.getAttribute('data-go');
      if (!go) return;
      const panel = document.getElementById(`painel-${go}`);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  applyImageFallbacks();
  initPlanCarousels();
  setPricingMode('mensal');
})();
