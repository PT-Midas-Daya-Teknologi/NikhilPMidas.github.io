"use strict";

let map;
let markers = {};
let infoWindows = {};

function updateCount() {
  const msgArea = document.getElementById("msgArea");
  const charCount = document.getElementById("charCount");
  if (msgArea && charCount) {
    charCount.textContent = msgArea.value.length;
  }
}

function switchOffice(card) {
  const id = card.getAttribute("data-id");
  document.querySelectorAll(".office-card").forEach(c => c.classList.remove("active"));
  card.classList.add("active");
  const marker = markers[id];
  const info = infoWindows[id];
  if (!marker || !map) return;
  map.setZoom(14);
  const position = typeof marker.getPosition === "function" ? marker.getPosition() : marker.position;
  map.panTo(position);
  Object.values(infoWindows).forEach(iw => iw.close());
  if (info) {
    info.open({
      anchor: marker,
      map: map
    });
  }
}

function resetMap() {
  if (!map) return;
  map.setZoom(2);
  map.setCenter({ lat: 20, lng: 78 });
  Object.values(infoWindows).forEach(iw => iw.close());
  document.querySelectorAll(".office-card").forEach(c => c.classList.remove("active"));
}

async function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  let AdvancedMarkerElement;
  try {
    if (google.maps.importLibrary) {
      const markerLib = await google.maps.importLibrary("marker");
      AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    } else if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      AdvancedMarkerElement = google.maps.marker.AdvancedMarkerElement;
    }
  } catch (e) {
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      AdvancedMarkerElement = google.maps.marker.AdvancedMarkerElement;
    }
  }

  map = new google.maps.Map(mapElement, {
    zoom: 2,
    center: { lat: 20, lng: 78 },
    mapId: "DEMO_MAP_ID"
  });

  const locations = {
    indonesia: {
      title: "Jakarta HQ",
      position: { lat: -6.2163, lng: 106.8306 },
      address: "Lippo Kuningan Building, 18th Floor, Unit F2, JI. H. R. Rasuna Said Kav, B-12, Jakarta Selatan 12940, Indonesia"
    },
    pune: {
      title: "Pune Office",
      position: { lat: 18.5308, lng: 73.847 },
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
      position: { lat: 23.7515, lng: 90.39 },
      address: "Dhaka, Bangladesh"
    },
    nz: {
      title: "New Zealand Office",
      position: { lat: -36.865, lng: 174.63 },
      address: "Auckland, New Zealand"
    },
    singapore: {
      title: "Singapore Office",
      position: { lat: 1.3181, lng: 103.892 },
      address: "Paya Lebar Square, Singapore"
    }
  };

  Object.keys(locations).forEach(id => {
    const loc = locations[id];
    let marker;

    if (AdvancedMarkerElement) {
      marker = new AdvancedMarkerElement({
        position: loc.position,
        map: map,
        title: loc.title
      });
    } else {
      marker = new google.maps.Marker({
        position: loc.position,
        map: map,
        title: loc.title
      });
    }

    const infoWindow = new google.maps.InfoWindow({
      content: `<h3>${loc.title}</h3><p>${loc.address}</p>
<a href="https://www.google.com/maps?q=${loc.position.lat},${loc.position.lng}" target="_blank">
Open in Maps ↗</a>`
    });

    const onMarkerClick = () => {
      Object.values(infoWindows).forEach((iw) => iw.close());
      infoWindow.open({
        anchor: marker,
        map: map
      });
    };

    if (marker.addEventListener) {
      marker.addEventListener("gmp-click", onMarkerClick);
    } else if (marker.addListener) {
      marker.addListener("click", onMarkerClick);
    }

    markers[id] = marker;
    infoWindows[id] = infoWindow;
  });

  document.addEventListener("click", function (e) {
    const isCard = e.target.closest(".office-card");
    if (!isCard) {
      resetMap();
    }
  });
}

// Explicitly bind to window scope for Google Maps callback and inline event handlers
window.initMap = initMap;
window.switchOffice = switchOffice;
window.updateCount = updateCount;
window.resetMap = resetMap;

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".open-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });
});