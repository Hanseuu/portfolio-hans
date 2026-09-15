/* ==========================================================================
   Hans Hendyanto — Portfolio
   Vanilla JS: nav, scroll reveal, portfolio filter, lightbox, contact form.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Footer */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------- Header scrolled state */
  const header = $('#siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------- Mobile nav menu */
  const navToggle = $('#navToggle');
  const navLinks  = $('#navLinks');

  const closeNav = () => {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Buka menu navigasi');
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute(
        'aria-label',
        open ? 'Tutup menu navigasi' : 'Buka menu navigasi'
      );
    });

    // Collapse after picking a destination, or when the layout goes desktop.
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', (ev) => {
      if (ev.matches) closeNav();
    });
  }

  /* --------------------------------------------------- Active nav link sync */
  const sections = $$('main section[id]');
  const linkFor = new Map(
    $$('.nav-links a').map((a) => [a.getAttribute('href').slice(1), a])
  );

  if (sections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      linkFor.forEach((link, key) => link.classList.toggle('is-active', key === id));
    };

    const spy = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that is intersecting.
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------- Scroll reveal in */
  const revealItems = $$('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach((el, i) => {
      // Small stagger for items that appear in a row together.
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
      revealer.observe(el);
    });
  }

  /* ---------------------------------------------------- Portfolio filtering */
  const grid       = $('#portfolioGrid');
  const filters    = $$('.filter');
  const emptyState = $('#emptyState');
  const items      = grid ? $$('.portfolio-item', grid) : [];

  const applyFilter = (value) => {
    let shown = 0;
    items.forEach((item) => {
      const match = value === 'all' || item.dataset.category === value;
      item.classList.toggle('is-hidden', !match);
      if (match) shown += 1;
    });
    if (emptyState) emptyState.hidden = shown !== 0;
  };

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      applyFilter(btn.dataset.filter);
    });
  });

  /* ---------------------------------------------------------- Lightbox view */
  const lightbox = $('#lightbox');
  const lbImage  = $('#lbImage');
  const lbCap    = $('#lbCaption');
  const lbClose  = $('#lbClose');
  const lbPrev   = $('#lbPrev');
  const lbNext   = $('#lbNext');

  if (lightbox && lbImage && items.length) {
    let index = 0;
    let lastFocused = null;

    // Only navigate through what the current filter leaves on screen.
    const visibleItems = () => items.filter((it) => !it.classList.contains('is-hidden'));

    const supportsWebp = (() => {
      const c = document.createElement('canvas');
      return !!(c.toDataURL && c.toDataURL('image/webp').startsWith('data:image/webp'));
    })();

    const show = (item) => {
      const webp = item.dataset.fullWebp;
      const jpg  = item.dataset.full;
      const thumb = $('img', item);
      const title = $('.overlay-title', item);

      lbImage.src = supportsWebp && webp ? webp : jpg;
      lbImage.alt = thumb ? thumb.alt : '';
      lbCap.textContent = title ? title.textContent.trim() : '';
    };

    const open = (item) => {
      const list = visibleItems();
      index = Math.max(0, list.indexOf(item));
      lastFocused = document.activeElement;
      show(item);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };

    const close = () => {
      lightbox.hidden = true;
      // removeAttribute, not src = '' — an empty src resolves against the
      // document URL and fires a pointless request for the page itself.
      lbImage.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    const step = (delta) => {
      const list = visibleItems();
      if (!list.length) return;
      index = (index + delta + list.length) % list.length;
      show(list[index]);
    };

    items.forEach((item) => {
      const btn = $('.portfolio-btn', item);
      if (btn) btn.addEventListener('click', () => open(item));
    });

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', () => step(-1));
    lbNext.addEventListener('click', () => step(1));

    // Click the backdrop (but not the image or controls) to dismiss.
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lb-figure')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')     { close(); }
      if (e.key === 'ArrowLeft')  { step(-1); }
      if (e.key === 'ArrowRight') { step(1); }
      if (e.key === 'Tab') {
        // Keep focus inside the dialog while it is open.
        const focusable = [lbClose, lbPrev, lbNext];
        const i = focusable.indexOf(document.activeElement);
        e.preventDefault();
        const nextIdx = e.shiftKey
          ? (i <= 0 ? focusable.length - 1 : i - 1)
          : (i === focusable.length - 1 ? 0 : i + 1);
        focusable[nextIdx].focus();
      }
    });
  }

  /* ------------------------------------------------- Contact / comment form */
  const form   = $('#commentForm');
  const status = $('#formStatus');
  const STORAGE_KEY = 'hans-portfolio-comments';

  const commentsWrap = $('#commentsWrap');
  const commentsList = $('#commentsList');
  const clearBtn     = $('#clearComments');

  const readStore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeStore = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* storage full or blocked — the UI still shows the session's entries */
    }
  };

  const renderComments = () => {
    if (!commentsList || !commentsWrap) return;
    const list = readStore();
    commentsWrap.hidden = list.length === 0;
    commentsList.textContent = '';

    list
      .slice()
      .reverse()
      .forEach((entry) => {
        const li = document.createElement('li');

        const meta = document.createElement('div');
        meta.className = 'comment-meta';

        const name = document.createElement('span');
        name.className = 'comment-name';
        name.textContent = entry.name;                       // textContent = no HTML injection

        const date = document.createElement('time');
        date.className = 'comment-date';
        date.dateTime = entry.date;
        date.textContent = new Date(entry.date).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const text = document.createElement('p');
        text.className = 'comment-text';
        text.textContent = entry.message;

        meta.append(name, date);
        li.append(meta, text);
        commentsList.append(li);
      });
  };

  const setError = (input, message) => {
    const errEl = $(`#${input.id}Error`);
    const invalid = Boolean(message);
    input.setAttribute('aria-invalid', String(invalid));
    if (errEl) {
      errEl.textContent = message || '';
      errEl.hidden = !invalid;
    }
    return !invalid;
  };

  const validate = (form) => {
    const name    = form.elements.name;
    const email   = form.elements.email;
    const message = form.elements.message;

    const okName = setError(
      name,
      name.value.trim().length < 2 ? 'Nama minimal 2 karakter.' : ''
    );
    const okEmail = setError(
      email,
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())
        ? ''
        : 'Masukkan alamat email yang valid.'
    );
    const okMessage = setError(
      message,
      message.value.trim().length < 10 ? 'Pesan minimal 10 karakter.' : ''
    );

    return { valid: okName && okEmail && okMessage, name, email, message };
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { valid, name, email, message } = validate(form);

      if (!valid) {
        if (status) {
          status.textContent = 'Mohon perbaiki kolom yang ditandai.';
          status.classList.remove('is-ok');
        }
        const firstBad = $('[aria-invalid="true"]', form);
        if (firstBad) firstBad.focus();
        return;
      }

      const list = readStore();
      list.push({
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
        date: new Date().toISOString(),
      });
      writeStore(list);
      renderComments();

      form.reset();
      [name, email, message].forEach((el) => setError(el, ''));

      if (status) {
        status.textContent = 'Terima kasih! Pesan kamu sudah tersimpan.';
        status.classList.add('is-ok');
        window.setTimeout(() => {
          status.textContent = '';
          status.classList.remove('is-ok');
        }, 6000);
      }
    });

    // Clear a field's error as soon as the visitor starts fixing it.
    $$('input, textarea', form).forEach((el) => {
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') setError(el, '');
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      writeStore([]);
      renderComments();
      if (status) {
        status.textContent = 'Semua pesan tersimpan telah dihapus.';
        status.classList.remove('is-ok');
      }
    });
  }

  renderComments();
})();
