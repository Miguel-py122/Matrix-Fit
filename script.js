(() => {
  const whatsappPhone = '5577999202077';
  const yearEl = document.getElementById('ano');
  const pricingModeButtons = Array.from(document.querySelectorAll('[data-pricing-mode]'));
  const pricingSections = Array.from(document.querySelectorAll('[data-pricing-section]'));

  function isMobileDevice() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      return navigator.userAgentData.mobile;
    }

    return /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function buildWhatsAppTargets(message) {
    const encodedMessage = encodeURIComponent(message);
    return {
      app: `whatsapp://send?phone=${whatsappPhone}&text=${encodedMessage}`,
      web: `https://web.whatsapp.com/send?phone=${whatsappPhone}&text=${encodedMessage}`,
      universal: `https://wa.me/${whatsappPhone}?text=${encodedMessage}`,
    };
  }

  function openWhatsApp(message) {
    const targets = buildWhatsAppTargets(message);
    let fallbackTimer = 0;

    const clearFallback = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', clearFallback);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clearFallback();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', clearFallback, { once: true });

    if (isMobileDevice()) {
      fallbackTimer = window.setTimeout(() => {
        window.location.assign(targets.universal);
      }, 700);

      window.location.assign(targets.app);
      return;
    }

    fallbackTimer = window.setTimeout(() => {
      window.location.assign(targets.universal);
    }, 900);

    window.location.assign(targets.web);
  }

  function getPricingCardDetails(button) {
    const card = button.closest('.pricing-card');
    if (!card) return null;

    const plano = card.querySelector('.pricing-card__plan')?.textContent?.trim() || button.dataset.plano?.trim() || '';
    const preco = card.querySelector('.pricing-card__price')?.textContent?.trim() || '';
    const condicao = card.querySelector('.pricing-card__price-suffix')?.textContent?.trim() || '';
    const destaque = card.querySelector('.pricing-card__badge')?.textContent?.trim() || '';
    const frequencia = card.querySelector('.pricing-card__meta-chip')?.textContent?.trim() || '';

    return {
      plano,
      preco,
      condicao,
      destaque,
      frequencia,
    };
  }

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

    const mobileMedia = window.matchMedia('(max-width: 768px)');

    carousels.forEach((carousel) => {
      const track = carousel.querySelector('.pricing-cards--variants');
      const cards = track ? Array.from(track.querySelectorAll('.pricing-card')) : [];
      const prevButton = carousel.querySelector('.plan-carousel__arrow--prev');
      const nextButton = carousel.querySelector('.plan-carousel__arrow--next');
      if (!track || !cards.length) return;

      let currentIndex = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      let scrollFrame = 0;

      const dots = document.createElement('div');
      dots.className = 'plan-carousel__dots';

      const dotButtons = cards.map((card, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'plan-carousel__dot';
        button.setAttribute('aria-label', `Ir para ${card.querySelector('.pricing-card__plan')?.textContent || `plano ${index + 1}`}`);
        button.addEventListener('click', () => {
          if (mobileMedia.matches) scrollToCard(index);
          else {
            currentIndex = index;
            renderDesktop();
          }
        });
        dots.appendChild(button);
        return button;
      });

      carousel.appendChild(dots);

      const updateDots = () => {
        dotButtons.forEach((button, index) => {
          button.classList.toggle('is-active', index === currentIndex);
        });
      };

      const updateMobileArrows = () => {
        if (!mobileMedia.matches) {
          prevButton?.removeAttribute('disabled');
          nextButton?.removeAttribute('disabled');
          return;
        }

        const atStart = currentIndex <= 0;
        const atEnd = currentIndex >= cards.length - 1;
        prevButton?.toggleAttribute('disabled', atStart);
        nextButton?.toggleAttribute('disabled', atEnd);
        prevButton?.setAttribute('aria-disabled', atStart ? 'true' : 'false');
        nextButton?.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
      };

      const renderDesktop = () => {
        const total = cards.length;
        const prevIndex = (currentIndex - 1 + total) % total;
        const nextIndex = (currentIndex + 1) % total;

        carousel.classList.remove('is-mobile-carousel');
        cards.forEach((card, index) => {
          card.classList.remove('is-current', 'is-prev', 'is-next', 'is-hidden');

          if (index === currentIndex) card.classList.add('is-current');
          else if (index === prevIndex) card.classList.add('is-prev');
          else if (index === nextIndex) card.classList.add('is-next');
          else card.classList.add('is-hidden');
        });

        updateDots();
        updateMobileArrows();
      };

      const syncIndexFromScroll = () => {
        let closestIndex = 0;
        let smallestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
          const distance = Math.abs(card.offsetLeft - track.scrollLeft);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
          }
        });

        currentIndex = closestIndex;
        cards.forEach((card, index) => {
          card.classList.toggle('is-current', index === currentIndex);
        });
        updateDots();
        updateMobileArrows();
      };

      const scrollToCard = (index, behavior = 'smooth') => {
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        track.scrollTo({ left: cards[currentIndex].offsetLeft, behavior });
        syncIndexFromScroll();
      };

      const renderMobile = (behavior = 'auto') => {
        carousel.classList.add('is-mobile-carousel');
        cards.forEach((card) => {
          card.classList.remove('is-prev', 'is-next', 'is-hidden');
        });
        scrollToCard(currentIndex, behavior);
      };

      prevButton?.addEventListener('click', () => {
        if (mobileMedia.matches) {
          scrollToCard(currentIndex - 1);
          return;
        }

        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        renderDesktop();
      });

      nextButton?.addEventListener('click', () => {
        if (mobileMedia.matches) {
          scrollToCard(currentIndex + 1);
          return;
        }

        currentIndex = (currentIndex + 1) % cards.length;
        renderDesktop();
      });

      carousel.addEventListener(
        'touchstart',
        (event) => {
          if (mobileMedia.matches) return;
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
          if (mobileMedia.matches) return;
          const touch = event.changedTouches[0];
          if (!touch) return;

          const deltaX = touch.clientX - touchStartX;
          const deltaY = touch.clientY - touchStartY;

          if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

          if (deltaX < 0) currentIndex = (currentIndex + 1) % cards.length;
          else currentIndex = (currentIndex - 1 + cards.length) % cards.length;

          renderDesktop();
        },
        { passive: true },
      );

      cards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
          if (mobileMedia.matches) return;
          currentIndex = index;
          renderDesktop();
        });

        card.addEventListener('click', () => {
          if (mobileMedia.matches) {
            currentIndex = index;
            syncIndexFromScroll();
            return;
          }

          currentIndex = index;
          renderDesktop();
        });
      });

      track.addEventListener(
        'scroll',
        () => {
          if (!mobileMedia.matches) return;
          window.cancelAnimationFrame(scrollFrame);
          scrollFrame = window.requestAnimationFrame(syncIndexFromScroll);
        },
        { passive: true },
      );

      const syncMode = () => {
        if (mobileMedia.matches) renderMobile('auto');
        else renderDesktop();
      };

      if (typeof mobileMedia.addEventListener === 'function') {
        mobileMedia.addEventListener('change', syncMode);
      } else if (typeof mobileMedia.addListener === 'function') {
        mobileMedia.addListener(syncMode);
      }

      window.addEventListener('resize', () => {
        if (mobileMedia.matches) renderMobile('auto');
      });

      syncMode();
    });
  }

  function initMobileMenu() {
    const toggle = document.querySelector('.topbar__toggle');
    const nav = document.querySelector('.tabs');
    if (!toggle || !nav) return;

    const isMenuOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    let lastToggleTime = 0;

    const toggleMenu = () => {
      const now = Date.now();
      if (now - lastToggleTime < 220) return;
      lastToggleTime = now;

      if (isMenuOpen()) closeMenu();
      else openMenu();
    };

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

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    toggle.addEventListener(
      'touchend',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMenu();
      },
      { passive: false },
    );

    toggle.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') return;
      event.preventDefault();
      event.stopPropagation();
      toggleMenu();
    });

    nav.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!isMenuOpen()) return;
      if (event.target instanceof Node && (toggle.contains(event.target) || nav.contains(event.target))) return;
      closeMenu();
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
      if (items.length <= 1) {
        items.forEach((item) => {
          item.classList.add('is-active');
          item.removeAttribute('hidden');
        });
        return;
      }

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
        const text = [
          'Olá! Vim pelo site e quero mais informações.',
          '',
          `Nome: ${nome}`,
          '',
          'Mensagem:',
          mensagem,
        ].join('\n');

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.classList.add('is-loading');
        }

        window.setTimeout(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
          }

          form.reset();
          fields.forEach((field) => {
            field.classList.remove('is-invalid');
            field.querySelector('.field__input')?.setAttribute('aria-invalid', 'false');
          });

          setStatus('success', 'Abrindo o WhatsApp com sua mensagem pronta.');
          openWhatsApp(text);
        }, 450);
      });
    });
  }

  function initPricingWhatsAppButtons() {
    const pricingButtons = Array.from(document.querySelectorAll('.btn--pricing[data-plano]'));
    if (!pricingButtons.length) return;

    const mensagens = {
      mensal: ({ plano, preco, condicao, destaque, frequencia }) => {
        const detalhes = [preco, condicao].filter(Boolean).join(' ');
        const extras = [destaque, frequencia].filter(Boolean).join(' | ');
        return [
          `Olá! Quero fechar o plano ${plano}.`,
          detalhes ? `Valor anunciado: ${detalhes}.` : '',
          extras ? `Categoria: ${extras}.` : '',
          'Pode me passar o próximo passo?',
        ].filter(Boolean).join(' ');
      },
      trimestral: ({ plano, preco, condicao, destaque, frequencia }) => {
        const detalhes = [preco, condicao].filter(Boolean).join(' ');
        const extras = [destaque, frequencia].filter(Boolean).join(' | ');
        return [
          `Olá! Tenho interesse no plano ${plano}.`,
          detalhes ? `Condição vista no site: ${detalhes}.` : '',
          extras ? `Perfil: ${extras}.` : '',
          'Pode me enviar as condições para contratar?',
        ].filter(Boolean).join(' ');
      },
      diario: ({ plano, preco, condicao, destaque, frequencia }) => {
        const detalhes = [preco, condicao].filter(Boolean).join(' ');
        const extras = [destaque, frequencia].filter(Boolean).join(' | ');
        return [
          `Olá! Quero reservar o ${plano}.`,
          detalhes ? `Valor: ${detalhes}.` : '',
          extras ? `Opção: ${extras}.` : '',
          'Pode me orientar para confirmar?',
        ].filter(Boolean).join(' ');
      },
    };

    const getPlanoTipo = (plano) => {
      const planoNormalizado = plano.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (planoNormalizado.includes('diaria') || planoNormalizado.includes('pacote')) return 'diario';
      if (planoNormalizado.includes('trimestral')) return 'trimestral';
      return 'mensal';
    };

    pricingButtons.forEach((button) => {
      button.style.cursor = 'pointer';

      button.addEventListener('click', (event) => {
        const plano = button.dataset.plano?.trim();
        if (!plano) return;

        event.preventDefault();

        const tipo = getPlanoTipo(plano);
        const detalhesPlano = getPricingCardDetails(button) || {
          plano,
          preco: '',
          condicao: '',
          destaque: '',
          frequencia: '',
        };
        const mensagem = mensagens[tipo]?.(detalhesPlano) || `Olá! Tenho interesse no plano ${plano}. Pode me passar os detalhes para contratação?`;

        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
        openWhatsApp(mensagem);
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
  initPricingWhatsAppButtons();
  setPricingMode('mensal');
})();
