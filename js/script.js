document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Tema claro / oscuro ---------- */
    var themeBtn = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.dataset.theme = 'dark';
            if (themeBtn) themeBtn.textContent = '☀';
        } else {
            delete document.body.dataset.theme;
            if (themeBtn) themeBtn.textContent = '☾';
        }
    }

    applyTheme(localStorage.getItem('ecovatio-theme'));

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('ecovatio-theme', next);
            applyTheme(next);
        });
    }

    /* ---------- Menú móvil ---------- */
    var burger = document.getElementById('nav-burger');
    var navLinks = document.getElementById('nav-links');

    if (burger && navLinks) {
        burger.addEventListener('click', function () {
            var open = navLinks.classList.toggle('open');
            burger.setAttribute('aria-expanded', open);
            burger.textContent = open ? '✕' : '☰';
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                burger.textContent = '☰';
            });
        });
    }

       /* ---------- Carrusel de sistemas ---------- */
    var track = document.getElementById('car-track');

    if (track) {
        var carousel = track.closest('.carousel');
        var slides = track.children.length;
        var dotsWrap = document.getElementById('car-dots');
        var index = 0;
        var timer = null;
        var DELAY = 6000;   // ms entre slides (si lo cambias, ajusta el CSS del dot)

        for (var i = 0; i < slides; i++) {
            var dot = document.createElement('button');
            dot.className = 'carousel__dot';
            dot.setAttribute('aria-label', 'Ir al sistema ' + (i + 1));
            dot.dataset.index = i;
            dot.addEventListener('click', function () { goTo(Number(this.dataset.index), true); });
            dotsWrap.appendChild(dot);
        }

        function goTo(n, manual) {
            index = (n + slides) % slides;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
            dotsWrap.querySelectorAll('.carousel__dot').forEach(function (d, di) {
                d.classList.toggle('active', di === index);
            });
            if (manual) restart();
        }

        function play() {
            if (!timer && slides > 1) {
                timer = setInterval(function () { goTo(index + 1); }, DELAY);
            }
        }
        function stop() { clearInterval(timer); timer = null; }
        function restart() { stop(); play(); }

        document.getElementById('car-prev').addEventListener('click', function () { goTo(index - 1, true); });
        document.getElementById('car-next').addEventListener('click', function () { goTo(index + 1, true); });

        // pausa con el mouse encima y cuando la pestaña no está visible
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', play);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stop(); } else { play(); }
        });

        // swipe en móvil
        var touchX = null;
        carousel.addEventListener('touchstart', function (e) {
            touchX = e.touches[0].clientX;
            stop();
        }, { passive: true });

        carousel.addEventListener('touchend', function (e) {
            if (touchX === null) return;
            var dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 45) { goTo(index + (dx < 0 ? 1 : -1), true); } else { play(); }
            touchX = null;
        });

        goTo(0);

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
    }

    /* ---------- FAQ (acordeón) ---------- */
    document.querySelectorAll('.faq-item__q').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var item = btn.closest('.faq-item');
            var wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
            if (!wasOpen) item.classList.add('open');
        });
    });

    /* ---------- Calculadora de ahorro ---------- */
    var kwhInput = document.getElementById('calc-kwh');
    var billInput = document.getElementById('calc-bill');
    var seg = document.getElementById('calc-seg');

    if (kwhInput && billInput) {
        var SAVING_PCT = { residencial: 0.85, comercial: 0.75, industrial: 0.65 };
        var COST_PER_KW = 68000;   // RD$ por kWp instalado (referencial)
        var KWH_PER_KW = 130;      // producción mensual aprox. por kWp en RD
        var YIELD_YEAR = 1450;     // kWh/kWp/año aprox. en RD
        var CO2_FACTOR = 0.5;      // kg CO2 por kWh

        var prop = 'residencial';

        var outMonthly = document.getElementById('calc-monthly');
        var outYearly = document.getElementById('calc-yearly');
        var outRoi = document.getElementById('calc-roi');
        var outRoiBar = document.getElementById('calc-roi-bar');
        var outKwp = document.getElementById('out-kwp');
        var outCo2 = document.getElementById('out-co2');

        function fmt(n) { return 'RD$ ' + Math.round(n).toLocaleString('es-DO'); }

        function calculate() {
            var kwh = Math.max(0, parseFloat(kwhInput.value) || 0);
            var bill = Math.max(0, parseFloat(billInput.value) || 0);

            var monthly = bill * SAVING_PCT[prop];
            var yearly = monthly * 12;

            outMonthly.textContent = fmt(monthly);
            outYearly.textContent = fmt(yearly);

            var sysCost = (kwh / KWH_PER_KW) * COST_PER_KW;
            if (yearly > 0 && sysCost > 0) {
                var roi = sysCost / yearly;
                var clamped = Math.min(10, Math.max(0.5, roi));
                outRoi.textContent = clamped.toFixed(1) + ' años';
                outRoiBar.style.width = (clamped / 10 * 100).toFixed(0) + '%';
            } else {
                outRoi.textContent = '—';
                outRoiBar.style.width = '0%';
            }

            if (outKwp) outKwp.textContent = ((kwh * 12) / YIELD_YEAR).toFixed(2) + ' kWp';
            if (outCo2) outCo2.textContent = Math.round(kwh * 12 * CO2_FACTOR).toLocaleString('es-DO') + ' kg/año';
        }

        kwhInput.addEventListener('input', calculate);
        billInput.addEventListener('input', calculate);

        if (seg) {
            seg.querySelectorAll('.seg__btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    prop = btn.dataset.prop;
                    seg.querySelectorAll('.seg__btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    calculate();
                });
            });
        }

        calculate();
    }

    /* ---------- Formulario de contacto (AJAX) ---------- */
    var contactForm = document.getElementById('contact-form');
    var formStatus = document.getElementById('form-status');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            fetch(contactForm.action, {
                method: contactForm.method,
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            }).then(function (response) {
                if (response.ok) {
                    formStatus.classList.add('show');
                    contactForm.reset();
                    setTimeout(function () { formStatus.classList.remove('show'); }, 6000);
                } else {
                    response.json().then(function (data) {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data.errors.map(function (err) { return err.message; }).join(', '));
                        } else {
                            alert('Oops! Hubo un problema al enviar el formulario.');
                        }
                    });
                }
            }).catch(function () {
                alert('Oops! Hubo un problema al enviar el formulario.');
            });
        });
    }

    /* ---------- Botón volver arriba ---------- */
    var topBtn = document.getElementById('widget-top');

    if (topBtn) {
        window.addEventListener('scroll', function () {
            topBtn.classList.toggle('show', window.scrollY > 600);
        }, { passive: true });

        topBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Animación al hacer scroll ---------- */
    if ('IntersectionObserver' in window) {
        document.documentElement.classList.add('js');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
});
