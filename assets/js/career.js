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
