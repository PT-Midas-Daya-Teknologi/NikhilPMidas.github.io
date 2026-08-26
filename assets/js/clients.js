(function () {
    function initMarquee() {
        const wrappers = document.querySelectorAll('.client-marquee-wrapper');
        if (wrappers.length < 2) return;

        const marqueeTrack1 = wrappers[0].querySelector('.client-marquee-track');
        const marqueeTrack2 = wrappers[1].querySelector('.client-marquee-track');

        if (!marqueeTrack1 || !marqueeTrack2) return;

        fetch('./assets/data/clients.json')
            .then(response => response.json())
            .then(clients => {
                if (!Array.isArray(clients) || clients.length === 0) return;

                const half = Math.ceil(clients.length / 2);
                const row1Clients = clients.slice(0, half);
                const row2Clients = clients.slice(half);

                renderMarquee(marqueeTrack1, row1Clients);
                renderMarquee(marqueeTrack2, row2Clients);
            })
            .catch(error => console.error('Error loading clients:', error));
    }

    function renderMarquee(track, clients) {
        track.innerHTML = '';
        const html = clients.map(client => `
            <a href="#" class="client-marquee-item">
                <img src="${client.src}" alt="${client.alt}" loading="lazy" />
            </a>
        `).join('');
        track.innerHTML = html + html;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarquee);
    } else {
        initMarquee();
    }
})();
