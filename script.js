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
      let touchStartX = 0;
      let touchStartY = 0;
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

      carousel.addEventListener(
        'touchstart',
        (event) => {
          const touch = event.changedTouches[0];
          if (!touch) return;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        },
        { passive: true },
      );

      carousel.addEventListener(
        'touchend',
        (event) => {
          const touch = event.changedTouches[0];
          if (!touch) return;

          const deltaX = touch.clientX - touchStartX;
          const deltaY = touch.clientY - touchStartY;

          if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

          if (deltaX < 0) currentIndex = (currentIndex + 1) % cards.length;
          else currentIndex = (currentIndex - 1 + cards.length) % cards.length;

          render();
        },
        { passive: true },
      );

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

  function initMobileMenu() {
    const toggle = document.querySelector('.topbar__toggle');
    const nav = document.querySelector('.tabs');
    if (!toggle || !nav) return;

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.classList.remove('is-mobile-nav-open');
    };

    const openMenu = () => {
      toggle.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');
      document.body.classList.add('is-mobile-nav-open');
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  function initPaginatedGalleries() {
    const galleries = Array.from(document.querySelectorAll('.gallery--pagination'));
    if (!galleries.length) return;

    galleries.forEach((gallery) => {
      const items = Array.from(gallery.querySelectorAll('.gallery__item'));
      if (items.length <= 1) return;

      let currentIndex = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      const controls = document.createElement('div');
      controls.className = 'gallery__controls';

      const prevButton = document.createElement('button');
      prevButton.type = 'button';
      prevButton.className = 'gallery__arrow gallery__arrow--prev';
      prevButton.setAttribute('aria-label', 'Imagem anterior');
      prevButton.innerHTML = '<span aria-hidden="true">&lsaquo;</span>';

      const dots = document.createElement('div');
      dots.className = 'gallery__dots';

      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'gallery__arrow gallery__arrow--next';
      nextButton.setAttribute('aria-label', 'Próxima imagem');
      nextButton.innerHTML = '<span aria-hidden="true">&rsaquo;</span>';

      const dotButtons = items.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery__dot';
        button.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
        button.addEventListener('click', () => {
          currentIndex = index;
          render();
        });
        dots.appendChild(button);
        return button;
      });

      controls.append(prevButton, dots, nextButton);
      gallery.appendChild(controls);

      const render = () => {
        items.forEach((item, index) => {
          item.classList.toggle('is-active', index === currentIndex);
          item.toggleAttribute('hidden', index !== currentIndex);
        });

        dotButtons.forEach((button, index) => {
          button.classList.toggle('is-active', index === currentIndex);
        });
      };

      prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        render();
      });

      nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        render();
      });

      gallery.addEventListener(
        'touchstart',
        (event) => {
          const touch = event.changedTouches[0];
          if (!touch) return;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        },
        { passive: true },
      );

      gallery.addEventListener(
        'touchend',
        (event) => {
          const touch = event.changedTouches[0];
          if (!touch) return;

          const deltaX = touch.clientX - touchStartX;
          const deltaY = touch.clientY - touchStartY;

          if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

          if (deltaX < 0) currentIndex = (currentIndex + 1) % items.length;
          else currentIndex = (currentIndex - 1 + items.length) % items.length;

          render();
        },
        { passive: true },
      );

      render();
    });
  }

  function initContactForms() {
    const forms = Array.from(document.querySelectorAll('[data-contact-form]'));
    if (!forms.length) return;

    const whatsappBaseUrl = 'https://wa.me/5577999202077';

    forms.forEach((form) => {
      const submitButton = form.querySelector('.contact-form__submit');
      const status = form.querySelector('.contact-form__status');
      const fields = Array.from(form.querySelectorAll('.field'));

      const setStatus = (type, message) => {
        if (!status) return;
        status.textContent = message;
        status.classList.remove('is-success', 'is-error');

        if (!message) {
          status.classList.remove('is-visible');
          return;
        }

        status.classList.add('is-visible');
        status.classList.add(type === 'success' ? 'is-success' : 'is-error');
      };

      const validateField = (field) => {
        const input = field.querySelector('.field__input');
        if (!input) return true;

        let isValid = input.checkValidity();
        if (isValid && input.hasAttribute('required') && typeof input.value === 'string') {
          isValid = input.value.trim().length > 0;
        }

        field.classList.toggle('is-invalid', !isValid);
        input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        return isValid;
      };

      const validateForm = () => fields.every(validateField);

      fields.forEach((field) => {
        const input = field.querySelector('.field__input');
        if (!input) return;

        input.setAttribute('aria-invalid', 'false');
        input.addEventListener('blur', () => validateField(field));
        input.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) validateField(field);
          if (status?.classList.contains('is-error')) setStatus('', '');
        });
      });

      form.addEventListener('submit', (event) => {
        const isValid = validateForm();

        if (!isValid) {
          event.preventDefault();
          setStatus('error', 'Revise os campos destacados para enviar sua mensagem.');
          fields.find((field) => field.classList.contains('is-invalid'))?.querySelector('.field__input')?.focus();
          return;
        }

        event.preventDefault();
        setStatus('', '');

        const formData = new FormData(form);
        const nome = String(formData.get('nome') || '').trim();
        const mensagem = String(formData.get('mensagem') || '').trim();
        const pageName = document.title || 'MatrixFit';
        const pagePath = window.location.pathname.split('/').pop() || 'index.html';
        const text = [
          'Oi MatrixFit! Quero falar com a equipe.',
          '',
          `Pagina de origem: ${pageName} (${pagePath})`,
          `Nome: ${nome}`,
          'Mensagem:',
          mensagem,
        ].join('\n');
        const whatsappUrl = `${whatsappBaseUrl}?text=${encodeURIComponent(text)}`;

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.classList.add('is-loading');
        }

        window.setTimeout(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
          }

          setStatus('success', 'Abrindo o WhatsApp nesta mesma tela.');
          window.location.href = whatsappUrl;
        }, 450);
      });
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
  initMobileMenu();
  initPaginatedGalleries();
  initPlanCarousels();
  initContactForms();
  setPricingMode('mensal');
})();
