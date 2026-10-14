(function() {
    "use strict";

    var items = Array.prototype.slice.call(document.querySelectorAll("[data-career-reveal]"));
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    function revealAll() {
        items.forEach(function(item) {
            item.classList.add("is-visible");
        });
    }

    if (motionPreference.matches || !("IntersectionObserver" in window)) {
        revealAll();
        return;
    }

    var observerHasReported = false;
    var observer = new IntersectionObserver(function(entries) {
        if (!observerHasReported) {
            observerHasReported = true;
            window.clearTimeout(revealFallback);
        }

        entries.forEach(function(entry) {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -36px 0px" });

    items.forEach(function(item) {
        observer.observe(item);
    });

    var revealFallback = window.setTimeout(function() {
        observer.disconnect();
        revealAll();
    }, 1200);

    if (motionPreference.addEventListener) {
        motionPreference.addEventListener("change", function(event) {
            if (event.matches) {
                observer.disconnect();
                revealAll();
            }
        });
    }
}());
