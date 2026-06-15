// NEXXAI site script — defensive (works across all pages)
document.addEventListener('DOMContentLoaded', function () {

    // ---- Particles background ----
    if (window.particlesJS && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": ["#5b21b6", "#8b5cf6", "#3b82f6", "#ec4899"] },
                "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 } },
                "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 0.5, "opacity_min": 0.1, "sync": false } },
                "size": { "value": 3, "random": true, "anim": { "enable": true, "speed": 2, "size_min": 0.1, "sync": false } },
                "line_linked": { "enable": true, "distance": 150, "color": "#5b21b6", "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 0.5, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": true, "rotateX": 600, "rotateY": 1200 } }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": {
                    "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } },
                    "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 },
                    "repulse": { "distance": 200, "duration": 0.4 },
                    "push": { "particles_nb": 4 },
                    "remove": { "particles_nb": 2 }
                }
            },
            "retina_detect": true
        });
    }

    // ---- Loading screen ----
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        setTimeout(function () { loadingScreen.classList.add('hidden'); }, 1400);
    }

    // ---- Scroll reveal animations ----
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    function checkScroll() {
        animateElements.forEach(function (element) {
            if (element.getBoundingClientRect().top < window.innerHeight * 0.88) {
                element.classList.add('show');
            }
        });
    }
    checkScroll();
    window.addEventListener('scroll', checkScroll);

    // ---- Mobile menu toggle ----
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // ---- Testimonial slider ----
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    if (testimonialSlides.length) {
        let currentSlide = 0;
        const showSlide = function (index) {
            testimonialSlides.forEach(function (s) { s.classList.remove('active'); });
            testimonialDots.forEach(function (d) { d.classList.remove('active'); });
            testimonialSlides[index].classList.add('active');
            if (testimonialDots[index]) testimonialDots[index].classList.add('active');
            currentSlide = index;
        };
        if (prevButton) prevButton.addEventListener('click', function () {
            showSlide((currentSlide - 1 + testimonialSlides.length) % testimonialSlides.length);
        });
        if (nextButton) nextButton.addEventListener('click', function () {
            showSlide((currentSlide + 1) % testimonialSlides.length);
        });
        testimonialDots.forEach(function (dot, index) {
            dot.addEventListener('click', function () { showSlide(index); });
        });
        setInterval(function () {
            showSlide((currentSlide + 1) % testimonialSlides.length);
        }, 8000);
    }

    // ---- FAQ accordion ----
    document.querySelectorAll('.faq-item').forEach(function (item) {
        const question = item.querySelector('.faq-question');
        if (question) question.addEventListener('click', function () { item.classList.toggle('active'); });
    });

    // ---- Contact form ----
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const closeSuccess = document.getElementById('closeSuccess');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var action = contactForm.getAttribute('action') || '';
            var showOk = function () {
                if (successMessage) successMessage.classList.add('active');
                contactForm.reset();
            };
            // Demo mode: until a real Formspree endpoint is set, just confirm.
            if (!action || action.indexOf('YOUR_FORM_ID') !== -1) {
                setTimeout(showOk, 600);
                return;
            }
            var btn = contactForm.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
            fetch(action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            }).then(function (res) {
                if (res.ok) { showOk(); }
                else { alert('Sorry, something went wrong. Please email santiago@nexxai.world.'); }
            }).catch(function () {
                alert('Network error. Please email us at santiago@nexxai.world.');
            }).finally(function () {
                if (btn) { btn.disabled = false; btn.textContent = "Let's Talk"; }
            });
        });
    }
    if (closeSuccess && successMessage) {
        closeSuccess.addEventListener('click', function () { successMessage.classList.remove('active'); });
    }

    // ---- Smooth scroll for in-page anchors ----
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        const href = anchor.getAttribute('href');
        if (href.length <= 1) return;
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(href);
            if (!target) return; // let it behave normally if not on this page
            e.preventDefault();
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        });
    });

    // ---- Header background on scroll ----
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function () {
        if (!header) return;
        header.style.backgroundColor = window.pageYOffset > 50 ? 'rgba(10, 10, 15, 0.95)' : 'rgba(10, 10, 15, 0.8)';
    });

    // ---- Hero 3D sphere (home only) ----
    const heroSection = document.querySelector('.hero');
    const aiSphere = document.querySelector('.ai-sphere');
    if (heroSection && aiSphere) {
        heroSection.addEventListener('mousemove', function (e) {
            const x = e.clientX / window.innerWidth - 0.5;
            const y = e.clientY / window.innerHeight - 0.5;
            aiSphere.style.transform = `translate(-50%, -50%) rotateY(${x * 20}deg) rotateX(${y * -20}deg)`;
        });
        heroSection.addEventListener('mouseleave', function () {
            aiSphere.style.transform = 'translate(-50%, -50%)';
        });
    }
});
