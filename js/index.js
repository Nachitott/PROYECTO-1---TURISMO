/**
 * WANDERLUST TURISMO — main.js
 * JavaScript mínimo: solo para lo que CSS no puede hacer solo.
 *
 * 1. Dark Mode toggle
 * 2. Header sticky scroll effect
 * 3. Menú móvil (hamburguesa)
 * 4. Mega-menú accesibilidad (aria-expanded)
 * 5. Contador animado (IntersectionObserver)
 * 6. Scroll Reveal (IntersectionObserver)
 * 7. Modal de confirmación (formulario contacto)
 * 8. Contador de caracteres (textarea)
 * 9. Año dinámico en copyright
 */

/* ============================================================
   ESPERAR A QUE EL DOM ESTÉ LISTO
   DOMContentLoaded: el HTML está parseado, pero imágenes/CSS
   pueden seguir cargando. Es el momento ideal para manipular el DOM.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────────────────
     1. DARK MODE TOGGLE
     ──────────────────────────────────────────────────────────
     Técnica:
     - localStorage guarda la preferencia del usuario entre sesiones.
     - JS solo cambia data-theme en <body>.
     - Todo el cambio visual lo hace el CSS con las variables.
     ────────────────────────────────────────────────────────── */
  const darkToggle = document.getElementById('darkModeToggle');
  const body       = document.body;

  // Aplicar el tema guardado al cargar (o el del sistema operativo)
  const savedTheme  = localStorage.getItem('wl-theme');
  const systemDark  = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
  body.setAttribute('data-theme', initialTheme);

  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      const current = body.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      body.setAttribute('data-theme', next);
      // localStorage: persiste entre recargas de página
      localStorage.setItem('wl-theme', next);
      // Accesibilidad: actualizar el label del botón
      darkToggle.setAttribute('aria-label',
        next === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'
      );
    });
  }

  /* ──────────────────────────────────────────────────────────
     2. HEADER — EFECTO AL HACER SCROLL
     ──────────────────────────────────────────────────────────
     IntersectionObserver observa un "sentinel" invisible al
     principio de la página. Cuando ya no está visible (el usuario
     bajó), agrega .is-scrolled al header para activar la sombra.
     
     Ventaja sobre scroll event: no hay re-renders por cada pixel
     de scroll. El observer solo dispara cuando el elemento
     entra o sale del viewport.
     ────────────────────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  if (header) {
    // Creamos un elemento sentinel al top del body
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        // Si el sentinel NO es visible → el usuario bajó → agregar clase
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    headerObserver.observe(sentinel);
  }

  /* ──────────────────────────────────────────────────────────
     3. MENÚ MÓVIL (HAMBURGUESA)
     ────────────────────────────────────────────────────────── */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav    = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-active', isOpen);
      // aria-expanded comunica el estado a lectores de pantalla
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      // Bloquear scroll del body cuando el menú está abierto
      body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      }
    });

    // Cerrar menú con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
        menuToggle.focus();
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     4. MEGA-MENÚ — ACCESIBILIDAD (aria-expanded)
     ──────────────────────────────────────────────────────────
     El mega-menú ya funciona con CSS (:hover/:focus-within).
     JS solo actualiza aria-expanded para lectores de pantalla.
     También agrega el toggle en móvil.
     ────────────────────────────────────────────────────────── */
  const megaMenuItems = document.querySelectorAll('.nav-item.has-megamenu');

  megaMenuItems.forEach(item => {
    const trigger = item.querySelector('.nav-link[aria-haspopup]');

    if (trigger) {
      // Actualizar aria-expanded en hover (para accesibilidad)
      item.addEventListener('mouseenter', () => {
        trigger.setAttribute('aria-expanded', 'true');
      });
      item.addEventListener('mouseleave', () => {
        trigger.setAttribute('aria-expanded', 'false');
      });

      // En móvil: toggle del submenú al hacer click
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const isOpen = item.classList.toggle('is-open');
          trigger.setAttribute('aria-expanded', String(isOpen));
        }
      });
    }
  });

  /* ──────────────────────────────────────────────────────────
     5. CONTADOR ANIMADO
     ──────────────────────────────────────────────────────────
     Técnica:
     - IntersectionObserver: activa el contador solo cuando
       el elemento entra al viewport (área visible).
     - requestAnimationFrame: anima el número frame a frame,
       sincronizado con el ciclo de render del navegador (60fps).
     - Easing: función cubic que suaviza la animación.
     
     Los elementos .stat-number tienen:
       data-target="500" → número final
       data-suffix="+"   → símbolo después del número
     ────────────────────────────────────────────────────────── */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            // Dejar de observar una vez que el contador arrancó
            counterObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.5 // Se activa cuando el 50% del elemento es visible
      }
    );

    counters.forEach(counter => counterObserver.observe(counter));
  }

  /**
   * Anima un elemento contando desde 0 hasta data-target.
   * @param {HTMLElement} el - Elemento con data-target y data-suffix
   */
  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const duration = 2000; // milisegundos
    let startTime  = null;

    /**
     * easeOutCubic: función de easing que desacelera al final.
     * t va de 0 a 1 (progreso normalizado).
     * Resultado: el contador empieza rápido y se frena al llegar al final.
     */
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    function step(timestamp) {
      if (!startTime) startTime = timestamp;

      // Progreso: de 0 (inicio) a 1 (fin)
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      // Valor actual: interpolación entre 0 y target
      const currentValue = Math.round(easedProgress * target);

      // Formatear el número con separador de miles
      el.textContent = currentValue.toLocaleString('es-AR') + suffix;

      // "Pop" visual al llegar al número final
      if (progress >= 1) {
        el.classList.add('is-counting');
        setTimeout(() => el.classList.remove('is-counting'), 300);
        return; // Detener el loop
      }

      // requestAnimationFrame: llama a step() en el próximo frame
      requestAnimationFrame(step);
    }

    // Iniciar la animación
    requestAnimationFrame(step);
  }

  /* ──────────────────────────────────────────────────────────
     6. SCROLL REVEAL
     ──────────────────────────────────────────────────────────
     Elementos con clase .reveal son invisibles por CSS.
     Al entrar al viewport → .is-visible → transición de entrada.
     ────────────────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target); // Solo una vez
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     7. MODAL DE CONFIRMACIÓN (Formulario de contacto)
     ────────────────────────────────────────────────────────── */
  const contactForm  = document.getElementById('contactForm');
  const modal        = document.getElementById('confirmModal');
  const modalBackdrop= document.getElementById('modalBackdrop');
  const modalClose   = document.getElementById('modalClose');
  const modalCloseBtn= document.getElementById('modalCloseBtn');
  const submitBtn    = document.getElementById('submitBtn');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modalBackdrop && modalBackdrop.classList.add('is-open');
    body.style.overflow = 'hidden';
    // Foco en el modal para accesibilidad
    setTimeout(() => modal.focus(), 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modalBackdrop && modalBackdrop.classList.remove('is-open');
    body.style.overflow = '';
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Marcar todos los campos como "tocados" para activar :invalid
      contactForm.querySelectorAll('input, textarea, select').forEach(field => {
        field.classList.add('was-touched');
      });

      // Verificar si el formulario es válido (HTML5 Constraint Validation API)
      if (!contactForm.checkValidity()) {
        // Foco en el primer campo inválido
        const firstInvalid = contactForm.querySelector(':invalid');
        firstInvalid && firstInvalid.focus();
        return;
      }

      // Simular carga: mostrar spinner
      if (submitBtn) submitBtn.classList.add('is-loading');

      // Simular delay de envío (en producción: fetch() a un endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (submitBtn) submitBtn.classList.remove('is-loading');

      // Mostrar modal de confirmación
      openModal();

      // Resetear formulario
      contactForm.reset();
      contactForm.querySelectorAll('.was-touched').forEach(f => {
        f.classList.remove('was-touched');
      });
    });
  }

  // Cerrar modal
  [modalClose, modalCloseBtn, modalBackdrop].forEach(el => {
    el && el.addEventListener('click', closeModal);
  });

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* ──────────────────────────────────────────────────────────
     8. CONTADOR DE CARACTERES (textarea del formulario)
     ────────────────────────────────────────────────────────── */
  const msgTextarea = document.getElementById('contact-mensaje');
  const charCounter = document.getElementById('mensaje-counter');

  if (msgTextarea && charCounter) {
    const maxLength = parseInt(msgTextarea.getAttribute('maxlength'), 10);

    msgTextarea.addEventListener('input', () => {
      const count = msgTextarea.value.length;
      charCounter.textContent = `${count} / ${maxLength}`;
      // Cambiar color al acercarse al límite
      charCounter.style.color = count > maxLength * 0.9
        ? 'var(--color-error)'
        : 'var(--color-text-muted)';
    });
  }

  /* ──────────────────────────────────────────────────────────
     9. AÑO DINÁMICO EN COPYRIGHT
     ────────────────────────────────────────────────────────── */
  document.querySelectorAll('#current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });


}); // fin DOMContentLoaded
