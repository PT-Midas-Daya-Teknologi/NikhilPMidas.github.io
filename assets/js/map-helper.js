"use strict"; // Start of use strict

let map;
let markers = {};
let infoWindows = {};
/* ── Character counter ── */
function updateCount() {
    document.getElementById('charCount').textContent =
        document.getElementById('msgArea').value.length;
}

// /* ── Office card click → show tooltip ── */
function switchOffice(card) {
    const id = card.getAttribute("data-id");

    document.querySelectorAll('.office-card')
        .forEach(c => c.classList.remove('active'));

    card.classList.add('active');

    const marker = markers[id];
    const info = infoWindows[id];

    if (!marker) return;

    map.setZoom(14);
    map.panTo(marker.getPosition());

    Object.values(infoWindows).forEach(iw => iw.close());

    info.open(map, marker);
}

/* ── Prevent open-link click from triggering switchOffice ── */
document.querySelectorAll('.open-link').forEach(function (link) {
    link.addEventListener('click', function (e) { e.stopPropagation(); });
});

function initMap() {

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: { lat: 20, lng: 78 }
    });

    const locations = {
        indonesia: {
            title: "Indonesia Office",
            position: { lat: -6.2146, lng: 106.8451 },
            address: "PT Midas Daya Teknologi, Jakarta"
        },
        pune: {
            title: "Pune Office",
            position: { lat: 18.5308, lng: 73.8470 },
            address: "Shivaji Nagar, Pune, India"
        },
        malaysia: {
            title: "Malaysia Office",
            position: { lat: 3.0738, lng: 101.5183 },
            address: "Selangor, Malaysia"
        },
        madurai: {
            title: "Madurai Office",
            position: { lat: 9.9252, lng: 78.1198 },
            address: "Madurai, Tamil Nadu, India"
        },
        bangladesh: {
            title: "Bangladesh Office",
            position: { lat: 23.7515, lng: 90.3900 },
            address: "Dhaka, Bangladesh"
        },
        nz: {
            title: "New Zealand Office",
            position: { lat: -36.8650, lng: 174.6300 },
            address: "Auckland, New Zealand"
        },
        singapore: {
            title: "Singapore Office",
            position: { lat: 1.3181, lng: 103.8920 },
            address: "Paya Lebar Square, Singapore"
        }
    };

    Object.keys(locations).forEach(id => {
        const loc = locations[id];

        const marker = new google.maps.Marker({
            position: loc.position,
            map: map,
            title: loc.title
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${loc.title}</h3><p>${loc.address}</p>
      <a href="https://www.google.com/maps?q=${loc.position.lat},${loc.position.lng}" target="_blank">
      Open in Maps ↗</a>`
        });

        marker.addListener("click", () => {
            Object.values(infoWindows).forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });

        // 🔥 STORE THEM HERE
        markers[id] = marker;
        infoWindows[id] = infoWindow;
    });

    function resetMap() {
        // Reset zoom + center
        map.setZoom(2);
        map.setCenter({ lat: 20, lng: 78 });

        // Close all info windows
        Object.values(infoWindows).forEach(iw => iw.close());

        // Remove active card highlight
        document.querySelectorAll('.office-card')
            .forEach(c => c.classList.remove('active'));
    }

    document.addEventListener("click", function (e) {
        const isCard = e.target.closest(".office-card");

        if (!isCard) {
            resetMap();
        }
    });

}