document.addEventListener('DOMContentLoaded', function () {
  const jobList = document.getElementById('jobList');
  const jobCount = document.getElementById('jobCount');
  let allJobs = [];

  // Fetch jobs from JSON
  fetch('/assets/data/jobs.json')
    .then(response => response.json())
    .then(data => {
      allJobs = data;
      renderJobs(allJobs);
    })
    .catch(error => console.error('Error loading jobs:', error));

  function renderJobs(jobs) {
    if (!jobList) return;
    jobList.innerHTML = '';
    if (jobCount) jobCount.textContent = `${jobs.length} Jobs available`;

    if (jobs.length === 0) {
      jobList.innerHTML = `
        <div class="col-lg-3 col-md-6 col-sm-12">
          <div class="job-card-custom text-center">
            <h4>Your dream job is coming soon!</h4>
            <div class="job-info">
              We are actively looking for talented individuals to join our team. Please check back later or visit our LinkedIn page for updates.
            </div>
            <a href="https://www.linkedin.com/company/pt-midas-daya-teknologi/" target="_blank" class="apply-btn">Visit LinkedIn</a>
          </div>
        </div>
      `;
      return;
    }

    // Use row layout
    jobList.className = 'row';

    jobs.forEach(job => {
      const skillsText = job.skills.join(', ');
      const experience = job.experience || '2 - 5 Years';
      const category = job.category || 'IT';

      const col = document.createElement('div');
      col.className = 'col-lg-3 col-md-6 col-sm-12';

      const jobUrl = `/career/job-details.html?id=${job.id}`;

      col.innerHTML = `
        <div class="job-card-custom" onclick="window.location.href='${jobUrl}'">
          <div class="category-box">${category}</div>
          <h4>${job.title}</h4>
          <div class="job-info">
            <b>Skills:</b> ${skillsText}<br> 
            <b>Experience:</b> ${experience}<br> 
            <b>Location:</b> ${job.location}
          </div>
          <a href="${jobUrl}" class="apply-btn">Apply</a>
        </div>
      `;
      jobList.appendChild(col);
    });
  }
});

(function () {
  let yearData = {};

  function preloadImages(data) {
    data.forEach(function (yearObj) {
      yearObj.events.forEach(function (event) {
        event.photos.forEach(function (photo) {
          if (!photo.src.toLowerCase().endsWith('.mp4')) {
            var img = new Image();
            img.src = photo.src;
          }
        });
      });
    });
  }

  function buildEventHTML(event, hidePhotos) {
    var photosHTML = event.photos.map(function (photo, index) {
      var hiddenClass = (hidePhotos && index >= 3) ? ' cg-photo-hidden' : '';
      var isVideo = photo.src.toLowerCase().endsWith('.mp4');

      var mediaElement = isVideo
        ? '<video src="' + photo.src + '" autoplay muted loop playsinline></video>'
        : '<img src="' + photo.src + '" alt="' + photo.alt + '" loading="lazy" />';

      return '<div class="cg-photo' + hiddenClass + '">' +
        mediaElement +
        '</div>';
    }).join('');

    var showMoreBtn = '';
    if (hidePhotos && event.photos.length > 3) {
      showMoreBtn = '<div class="cg-show-more-container">' +
        '<button class="cg-show-more" data-event="' + event.id + '">' +
        '<span class="cg-show-more-text">Show ' + (event.photos.length - 3) + ' More Photos</span>' +
        '</button>' +
        '</div>';
    }

    return '<div class="cg-event-block">' +
      '<div class="cg-event-header">' +
      '<div>' +
      '<h4 class="cg-event-title">' + event.title + '</h4>' +
      '<p class="cg-event-meta">' + event.meta + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="cg-photo-grid">' + photosHTML + '</div>' +
      showMoreBtn +
      '</div>';
  }

  function attachShowMoreListeners(container) {
    if (!container) return;
    container.querySelectorAll('.cg-show-more').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grid = this.closest('.cg-event-block').querySelector('.cg-photo-grid');
        var hiddenPhotos = grid.querySelectorAll('.cg-photo-hidden');
        var textEl = this.querySelector('.cg-show-more-text');
        var isExpanded = this.classList.contains('cg-expanded');

        if (!isExpanded) {
          hiddenPhotos.forEach(function (p) {
            p.classList.remove('cg-photo-hidden');
            p.classList.add('cg-fade-in');
          });
          textEl.textContent = 'Show Less';
          this.classList.add('cg-expanded');
        } else {
          grid.querySelectorAll('.cg-photo').forEach(function (p, i) {
            if (i >= 3) {
              p.classList.add('cg-photo-hidden');
              p.classList.remove('cg-fade-in');
            }
          });
          textEl.textContent = 'Show More Photos';
          this.classList.remove('cg-expanded');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch('/assets/data/events.json')
      .then(response => response.json())
      .then(data => {
        data.forEach(item => {
          yearData[item.year] = item;
        });

        preloadImages(data);

        /* Render Current Year (2026) */
        var eventsContainer = document.querySelector('.cg-events-container');
        if (eventsContainer) {
          var currentYear = '2026';
          var yearEntry = yearData[currentYear];
          if (yearEntry) {
            var html = yearEntry.events.map(function (event, index) {
              var divider = index < yearEntry.events.length - 1 ? '<div class="cg-event-divider"></div>' : '';
              return buildEventHTML(event, true) + divider;
            }).join('');
            eventsContainer.innerHTML = html;
            attachShowMoreListeners(eventsContainer);
          }
        }

        /* Previous year cards — open overlay */
        var overlay = document.getElementById('cgYearOverlay');
        var overlayYearEl = document.getElementById('cgOverlayYear');
        var overlayEventsEl = document.getElementById('cgOverlayEvents');
        var overlayClose = document.getElementById('cgOverlayClose');

        if (overlay) {
          document.querySelectorAll('.cg-prev-year-card').forEach(function (card) {
            card.addEventListener('click', function () {
              var year = this.getAttribute('data-year');
              var yearEntry = yearData[year];
              if (!yearEntry) return;

              overlayYearEl.textContent = year;

              var html = yearEntry.events.map(function (event, index) {
                var divider = index < yearEntry.events.length - 1
                  ? '<div class="cg-event-divider"></div>' : '';
                return buildEventHTML(event, true) + divider;
              }).join('');

              overlayEventsEl.innerHTML = html;
              attachShowMoreListeners(overlayEventsEl);

              overlay.classList.add('cg-overlay-active');
              document.body.style.overflow = 'hidden';
              overlay.scrollTop = 0;
            });
          });

          /* Close overlay */
          function closeOverlay() {
            overlay.classList.remove('cg-overlay-active');
            document.body.style.overflow = '';
            overlayEventsEl.innerHTML = '';
          }

          if (overlayClose) overlayClose.addEventListener('click', closeOverlay);

          /* Close on backdrop click (clicking outside overlay-inner) */
          overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOverlay();
          });

          /* Close on Escape key */
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('cg-overlay-active')) {
              closeOverlay();
            }
          });
        }
      })
      .catch(error => console.error('Error loading events:', error));
  });

})();
