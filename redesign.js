// NEXXAI redesign preview — reveal, nav, contact form
document.addEventListener('DOMContentLoaded', function () {
    // hero entrance (staggered blur-in)
    document.querySelectorAll('.hero .rv').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, 150 + i * 60);
    });
    // lower sections reveal on scroll
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { if (!el.closest('.hero')) io.observe(el); });
    // failsafe: nothing ever stays hidden
    setTimeout(function () { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }, 3000);

    // mobile menu
    var burger = document.querySelector('.nav-burger'), mnav = document.querySelector('.mnav'), x = document.querySelector('.mnav .x');
    if (burger && mnav) burger.addEventListener('click', function () { mnav.classList.add('open'); });
    if (x && mnav) x.addEventListener('click', function () { mnav.classList.remove('open'); });
    if (mnav) mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mnav.classList.remove('open'); }); });

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
});
