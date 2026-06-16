// NEXXAI redesign preview — entrance reveal + mobile menu
document.addEventListener('DOMContentLoaded', function () {
    // staggered blur-in for any .rv element
    var rv = [].slice.call(document.querySelectorAll('.rv'));
    rv.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, 150 + i * 65);
    });
    // failsafe: never leave content hidden
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 2600);

    // reveal-on-scroll for sections lower down
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.sec .rv, .cta-band .rv, .stats .rv').forEach(function (el) { io.observe(el); });

    // mobile menu
    var burger = document.querySelector('.nav-burger');
    var mnav = document.querySelector('.mnav');
    var close = document.querySelector('.mnav .x');
    if (burger && mnav) burger.addEventListener('click', function () { mnav.classList.add('open'); });
    if (close && mnav) close.addEventListener('click', function () { mnav.classList.remove('open'); });
    if (mnav) mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mnav.classList.remove('open'); }); });
});
