// NEXXAI site script — reveal, nav, FAQ, contact form, portfolio (works site-wide)
document.addEventListener('DOMContentLoaded', function () {
    // hero / page-hero entrance (staggered blur-in)
    document.querySelectorAll('.hero .rv, .phero .rv').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, 150 + i * 60);
    });
    // lower sections reveal on scroll
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { if (!el.closest('.hero') && !el.closest('.phero')) io.observe(el); });
    // failsafe: nothing ever stays hidden
    setTimeout(function () { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }, 3000);

    // mobile menu
    var burger = document.querySelector('.nav-burger'), mnav = document.querySelector('.mnav'), x = document.querySelector('.mnav .x');
    if (burger && mnav) burger.addEventListener('click', function () { mnav.classList.add('open'); });
    if (x && mnav) x.addEventListener('click', function () { mnav.classList.remove('open'); });
    if (mnav) mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mnav.classList.remove('open'); }); });

    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(function (item) {
        var q = item.querySelector('.faq-q');
        if (q) q.addEventListener('click', function () { item.classList.toggle('open'); });
    });

    // contact form (Formspree AJAX)
    var cf = document.getElementById('cf'), ok = document.getElementById('ok'), okc = document.getElementById('okc');
    if (cf) cf.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = cf.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        fetch(cf.action, { method: 'POST', body: new FormData(cf), headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (r.ok && ok) ok.classList.add('on'); cf.reset(); })
            .catch(function () { alert('Please email santiago@nexxai.world'); })
            .finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = 'Let\'s Talk <i class="fas fa-arrow-right"></i>'; } });
    });
    if (okc && ok) okc.addEventListener('click', function () { ok.classList.remove('on'); });

    // portfolio filters
    var filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length) {
        var workCards = document.querySelectorAll('.work-grid .work-card');
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var ff = btn.getAttribute('data-filter');
                workCards.forEach(function (c) {
                    c.style.display = (ff === 'all' || c.getAttribute('data-cat') === ff) ? '' : 'none';
                });
            });
        });
    }

    // portfolio detail modal
    var workModal = document.getElementById('workModal');
    if (workModal) {
        var wmMedia = document.getElementById('wmMedia'),
            wmCat = document.getElementById('wmCat'),
            wmTitle = document.getElementById('wmTitle'),
            wmDesc = document.getElementById('wmDesc'),
            wmStack = document.getElementById('wmStack');
        var playerHTML = function (v) {
            var yt = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
            if (yt) return '<iframe src="https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
            var vm = v.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
            if (vm) return '<iframe src="https://player.vimeo.com/video/' + vm[1] + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
            return '<video src="' + v + '" controls autoplay playsinline></video>';
        };
        var openModal = function (card) {
            var img = card.querySelector('.work-media img');
            var h3 = card.querySelector('h3');
            var cat = card.querySelector('.work-cat');
            var vid = card.getAttribute('data-video');
            wmMedia.innerHTML = vid ? playerHTML(vid) : ('<img src="' + (img ? img.getAttribute('src') : '') + '" alt="">');
            wmTitle.textContent = h3 ? h3.textContent : '';
            wmCat.textContent = cat ? cat.textContent : '';
            wmDesc.textContent = card.getAttribute('data-fulldesc') || '';
            wmStack.innerHTML = '';
            (card.getAttribute('data-stack') || '').split('|').forEach(function (s) {
                s = s.trim();
                if (s) { var el = document.createElement('span'); el.className = 'tag'; el.textContent = s; wmStack.appendChild(el); }
            });
            workModal.scrollTop = 0;
            workModal.classList.add('active');
            document.body.classList.add('modal-open');
        };
        document.querySelectorAll('.work-grid .work-card').forEach(function (card) {
            card.addEventListener('click', function () { openModal(card); });
        });
        var closeModal = function () { workModal.classList.remove('active'); document.body.classList.remove('modal-open'); wmMedia.innerHTML = ''; };
        workModal.querySelector('.work-modal-close').addEventListener('click', closeModal);
        workModal.querySelector('.work-modal-overlay').addEventListener('click', closeModal);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    }

    // cursor-reactive cards: 3D tilt toward the pointer (the border glow is CSS)
    if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
        document.querySelectorAll('.stat, .card, .svc, .feat, .wk, .work-card, .step, .tcard, .box, .ladder-item, .loc, .value, .tech-card, .cinfo, .faq-item').forEach(function (el) {
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                el.style.setProperty('--mx', (x * 100) + '%');
                el.style.setProperty('--my', (y * 100) + '%');
                el.style.transform = 'perspective(900px) rotateY(' + ((x - .5) * 8) + 'deg) rotateX(' + ((.5 - y) * 8) + 'deg) translateY(-4px)';
            });
            el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        });
    }
});
