(function() {
    "use strict";

    var items = Array.prototype.slice.call(document.querySelectorAll("[data-elite-reveal]"));
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    function revealAll() {
        items.forEach(function(item) {
            item.classList.add("is-visible");
        });
    }

    items.forEach(function(item) {
        var siblings = Array.prototype.slice.call(item.parentNode.children).filter(function(sibling) {
            return sibling.matches("[data-elite-reveal]");
        });
        item.style.setProperty("--elite-reveal-delay", siblings.indexOf(item) * 90 + "ms");
    });

    if (motionPreference.matches || !("IntersectionObserver" in window)) {
        revealAll();
        return;
    }

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
    }, { threshold: 0.14, rootMargin: "0px 0px -36px 0px" });

    var observerHasReported = false;
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
