// Particles.js Configuration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": ["#5b21b6", "#8b5cf6", "#3b82f6", "#ec4899"]
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 0.5,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 2,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#5b21b6",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 0.5,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": true,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.5
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });

    // Loading screen animation
    setTimeout(function() {
        document.querySelector('.loading-screen').classList.add('hidden');
    }, 2000);

    // Scroll animations
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    function checkScroll() {
        animateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight * 0.85) {
                element.classList.add('show');
            }
        });
    }
    
    // Initial check
    checkScroll();
    
    // Check on scroll
    window.addEventListener('scroll', checkScroll);

    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    menuToggle.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Navigation active state
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');
    
    function setActiveNavLink() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', setActiveNavLink);
    
    // Testimonial slider
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    let currentSlide = 0;
    
    function showSlide(index) {
        testimonialSlides.forEach(slide => slide.classList.remove('active'));
        testimonialDots.forEach(dot => dot.classList.remove('active'));
        
        testimonialSlides[index].classList.add('active');
        testimonialDots[index].classList.add('active');
        currentSlide = index;
    }
    
    prevButton.addEventListener('click', function() {
        let index = currentSlide - 1;
        if (index < 0) index = testimonialSlides.length - 1;
        showSlide(index);
    });
    
    nextButton.addEventListener('click', function() {
        let index = currentSlide + 1;
        if (index >= testimonialSlides.length) index = 0;
        showSlide(index);
    });
    
    testimonialDots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            showSlide(index);
        });
    });
    
    // Auto-rotate testimonials
    setInterval(function() {
        let index = currentSlide + 1;
        if (index >= testimonialSlides.length) index = 0;
        showSlide(index);
    }, 8000);
    
    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            item.classList.toggle('active');
        });
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const closeSuccess = document.getElementById('closeSuccess');
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate form submission
        setTimeout(function() {
            successMessage.classList.add('active');
            contactForm.reset();
        }, 1000);
    });
    
    closeSuccess.addEventListener('click', function() {
        successMessage.classList.remove('active');
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Parallax effect on scroll
    window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        
        // Header transparency on scroll
        const header = document.querySelector('.header');
        if (scrollPosition > 50) {
            header.style.backgroundColor = 'rgba(10, 10, 15, 0.95)';
        } else {
            header.style.backgroundColor = 'rgba(10, 10, 15, 0.8)';
        }
        
        // Parallax for hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        }
    });
    
    // 3D effect on mouse move for hero section
    const heroSection = document.querySelector('.hero');
    const aiSphere = document.querySelector('.ai-sphere');
    
    heroSection.addEventListener('mousemove', function(e) {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        
        if (aiSphere) {
            aiSphere.style.transform = `translate(-50%, -50%) rotateY(${x * 20}deg) rotateX(${y * -20}deg)`;
        }
    });
    
    // Reset 3D effect when mouse leaves
    heroSection.addEventListener('mouseleave', function() {
        if (aiSphere) {
            aiSphere.style.transform = 'translate(-50%, -50%)';
        }
    });
    
    // Package card hover effects
    const packageCards = document.querySelectorAll('.package-card');
    
    packageCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            if (card.classList.contains('featured')) {
                card.style.transform = 'scale(1.05)';
            } else {
                card.style.transform = 'none';
            }
        });
    });
    
    // Pricing Toggle Functionality
    const pricingToggle = document.getElementById('pricing-toggle');
    const monthlyLabel = document.getElementById('monthly-label');
    const sixMonthsLabel = document.getElementById('six-months-label');
    const packagePrices = document.querySelectorAll('.package-price');
    const originalPrices = document.querySelectorAll('.original-price');
    
    if (pricingToggle && monthlyLabel && sixMonthsLabel) {
        pricingToggle.addEventListener('click', function() {
            // Toggle active class on labels
            monthlyLabel.classList.toggle('active');
            sixMonthsLabel.classList.toggle('active');
            
            // Toggle switch class
            this.classList.toggle('six-months');
            
            // Update prices based on toggle state
            const isSixMonths = this.classList.contains('six-months');
            
            packagePrices.forEach(price => {
                // Add changing class for animation
                price.classList.add('changing');
                
                // Set timeout to allow animation to complete
                setTimeout(() => {
                    if (isSixMonths) {
                        price.textContent = price.getAttribute('data-six-months');
                    } else {
                        price.textContent = price.getAttribute('data-monthly');
                    }
                    
                    // Remove changing class after animation
                    setTimeout(() => {
                        price.classList.remove('changing');
                    }, 50);
                }, 250);
            });
            
            // Show/hide original prices
            originalPrices.forEach(price => {
                if (isSixMonths) {
                    price.style.display = 'block';
                } else {
                    price.style.display = 'none';
                }
            });
        });
    }
});
