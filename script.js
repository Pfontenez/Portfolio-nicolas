    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#main-nav');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
    }));
    const carousel = document.querySelector('#work-carousel');
    document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
      carousel.scrollBy({ left: Number(button.dataset.scroll) * carousel.clientWidth * .8, behavior: 'smooth' });
    }));

    const counters = [...document.querySelectorAll('.count-up')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const numberFormat = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    function formatCount(value, format) {
      if (format === 'millions') return `${numberFormat.format(value / 1_000_000)} M`;
      if (format === 'percent') return `+${numberFormat.format(value)}%`;
      return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
    }

    function animateCount(element) {
      const target = Number(element.dataset.count);
      const format = element.dataset.format;
      if (reducedMotion) {
        element.textContent = formatCount(target, format);
        return;
      }

      const duration = 1500;
      const start = performance.now();
      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatCount(target * eased, format);
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      const metricsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          counters.forEach(animateCount);
          metricsObserver.unobserve(entry.target);
        });
      }, { threshold: 0.3 });
      const metrics = document.querySelector('.metrics');
      if (metrics && counters.length) metricsObserver.observe(metrics);
    }


    const imageDialog = document.querySelector('#image-lightbox');
    const lightboxImage = document.querySelector('#lightbox-image');
    const lightboxCaption = document.querySelector('#lightbox-caption');
    const lightboxCount = document.querySelector('.lightbox-count');
    const images = [...document.querySelectorAll('main img:not(.coverage-map-image)')];
    const campaignImage = document.querySelector('#campaign-slide-image');
    const campaignOpenButton = document.querySelector('.campaign-slide-open');
    const campaignCounter = document.querySelector('.campaign-counter');
    const campaignSlides = [
      { src: 'media/meta-cuidados-1.webp', alt: 'Pieza de campaña: cuándo una persona necesita cuidados', caption: 'Cuándo una persona necesita cuidados' },
      { src: 'media/meta-cuidados-2.webp', alt: 'Pieza de campaña sobre la continuidad de los tratamientos de SIEMPRE', caption: 'Profesionales que garantizan la continuidad de cada tratamiento' },
      { src: 'media/meta-cuidados-3.webp', alt: 'Pieza de campaña sobre el plan inmediato de cuidados domiciliarios', caption: 'Plan inmediato de cuidados domiciliarios' },
      { src: 'media/meta-cuidados-4.webp', alt: 'Pieza de campaña para familias que necesitan asistencia para cuidar', caption: '¿Qué pasa si no tenés quién cuide a tu familiar?' }
    ].map(slide => ({ ...slide, src: new URL(slide.src, document.baseURI).href }));
    let campaignIndex = 0;
    let activeImageIndex = 0;
    let activeLightboxItems = [];
    let lastFocusedImage = null;

    function imageCaption(image) {
      const figureCaption = image.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
      return figureCaption || image.alt || '';
    }

    function renderCampaignSlide(index) {
      campaignIndex = (index + campaignSlides.length) % campaignSlides.length;
      const slide = campaignSlides[campaignIndex];
      campaignImage.src = slide.src;
      campaignImage.alt = slide.alt;
      campaignCounter.textContent = `${String(campaignIndex + 1).padStart(2, '0')} / ${String(campaignSlides.length).padStart(2, '0')}`;
      campaignOpenButton.setAttribute('aria-label', `Ampliar pieza ${campaignIndex + 1} de ${campaignSlides.length}: ${slide.caption}`);
    }

    document.querySelector('.campaign-prev').addEventListener('click', () => renderCampaignSlide(campaignIndex - 1));
    document.querySelector('.campaign-next').addEventListener('click', () => renderCampaignSlide(campaignIndex + 1));

    const lightboxItems = images.flatMap(image => image === campaignImage
      ? campaignSlides.map(slide => ({ ...slide, trigger: campaignOpenButton }))
      : [{ src: image.currentSrc || image.src, alt: image.alt, caption: imageCaption(image), trigger: image }]);

    function showLightboxImage(index) {
      activeImageIndex = (index + activeLightboxItems.length) % activeLightboxItems.length;
      const item = activeLightboxItems[activeImageIndex];
      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;
      lightboxCaption.textContent = item.caption;
      lightboxCount.textContent = `${activeImageIndex + 1} / ${activeLightboxItems.length}`;
    }

    function openLightbox(trigger) {
      lastFocusedImage = trigger;
      const source = trigger === campaignOpenButton ? campaignSlides[campaignIndex].src : trigger.currentSrc || trigger.src;
      activeLightboxItems = trigger === campaignOpenButton ? campaignSlides : lightboxItems;
      showLightboxImage(activeLightboxItems.findIndex(item => item.src === source));
      imageDialog.showModal();
      imageDialog.querySelector('.lightbox-close').focus();
    }

    images.forEach(image => {
      if (image === campaignImage) return;
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-haspopup', 'dialog');
      image.setAttribute('aria-label', `${image.alt || 'Abrir imagen'}; abrir galería`);
      image.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openLightbox(image);
      });
      image.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        openLightbox(image);
      });
    });

    campaignOpenButton.addEventListener('click', () => openLightbox(campaignOpenButton));

    imageDialog.querySelector('.lightbox-close').addEventListener('click', () => imageDialog.close());
    imageDialog.querySelector('.lightbox-prev').addEventListener('click', () => showLightboxImage(activeImageIndex - 1));
    imageDialog.querySelector('.lightbox-next').addEventListener('click', () => showLightboxImage(activeImageIndex + 1));
    imageDialog.addEventListener('click', event => {
      if (event.target === imageDialog) imageDialog.close();
    });
    imageDialog.addEventListener('close', () => lastFocusedImage?.focus());
    imageDialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showLightboxImage(activeImageIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showLightboxImage(activeImageIndex + 1); }
    });
