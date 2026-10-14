(function() {
    "use strict";

    var cards = Array.prototype.slice.call(document.querySelectorAll(".service-cards .service-card-reveal"));
    if (!cards.length) {
        return;
    }

    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    function revealAll() {
        cards.forEach(function(card) {
            card.classList.remove("is-pending");
            card.classList.add("is-visible");
        });
    }

    if (motionPreference.matches || !("IntersectionObserver" in window)) {
        revealAll();
        return;
    }

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) {
                return;
            }

            var card = entry.target;
            card.classList.remove("is-pending");
            card.classList.add("is-visible");
            observer.unobserve(card);
        });
    }, { threshold: 0.18, rootMargin: "0px 0px -32px 0px" });

    cards.forEach(function(card) {
        var delay = parseInt(card.getAttribute("data-wow-delay"), 10) || 0;
        card.style.setProperty("--wowoni-service-reveal-delay", delay + "ms");
        card.classList.add("is-pending");
        observer.observe(card);
    });

    var discoverMore = document.querySelector('.hero .theme-btn.btn-three[href="#services"]');
    if (discoverMore) {
        discoverMore.addEventListener("click", function() {
            if (motionPreference.matches) {
                return;
            }

            cards.forEach(function(card) {
                card.classList.remove("is-visible");
                card.classList.add("is-pending");
                card.classList.add("is-restarting");
            });

            void cards[0].offsetWidth;
            cards.forEach(function(card) {
                card.classList.remove("is-restarting");
            });
            void cards[0].offsetWidth;
            cards.forEach(function(card) {
                card.classList.remove("is-pending");
                card.classList.add("is-visible");
            });
        });
    }

    if (motionPreference.addEventListener) {
        motionPreference.addEventListener("change", function(event) {
            if (event.matches) {
                observer.disconnect();
                revealAll();
            }
        });
    }
}());