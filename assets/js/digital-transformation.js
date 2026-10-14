(function() {
    "use strict";

    var revealItems = Array.prototype.slice.call(document.querySelectorAll("[data-dt-reveal]"));
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    function revealAll() {
        revealItems.forEach(function(item) {
            item.classList.add("is-visible");
        });
    }

    revealItems.forEach(function(item, index) {
        var benefitIndex = item.classList.contains("wowoni-dt-benefit")
            ? Array.prototype.indexOf.call(item.parentNode.children, item)
            : 0;
        var delay = item.classList.contains("wowoni-dt-benefit") ? benefitIndex * 70 : 0;
        item.style.setProperty("--dt-reveal-delay", delay + "ms");
    });

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
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function(item) {
        observer.observe(item);
    });

    // Keep content available if the observer never reports, such as in local-file previews.
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
