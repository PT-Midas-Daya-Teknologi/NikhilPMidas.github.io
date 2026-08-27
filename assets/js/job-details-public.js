document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (!jobId) {
        window.location.href = 'all-jop-post.html';
        return;
    }

    fetch('./assets/data/jobs.json')
        .then(response => response.json())
        .then(jobs => {
            const job = jobs.find(j => j.id == jobId);
            if (job) {
                updateJobDetails(job);
                setupApplyToggle();
                setupFormValidation();
            } else {
                console.error('Job not found');
            }
        })
        .catch(error => console.error('Error fetching job details:', error));

    function updateJobDetails(job) {
        // Update Page Title and Breadcrumb
        document.title = `${job.title} - Midas Teknologi`;
        const titleHeading = document.querySelector('.page-title h1');
        const breadcrumbLast = document.querySelector('.bread-crumb li:last-child');
        if (titleHeading) titleHeading.textContent = job.title;
        if (breadcrumbLast) breadcrumbLast.textContent = job.title;

        // Update Summary Grid
        const skillsSummary = document.getElementById('jobSkillsSummary');
        const expSummary = document.getElementById('jobExpSummary');
        const locSummary = document.getElementById('jobLocSummary');
        const categorySummary = document.getElementById('jobDomain');
        
        if (skillsSummary) skillsSummary.textContent = job.skills.join(', ');
        if (expSummary) expSummary.textContent = job.experience;
        if (locSummary) locSummary.textContent = `${job.location} [Indonesia]`;
        if (categorySummary) categorySummary.textContent = job.category || 'IT';

        // Update Hidden Subject for Email
        const jobSubject = document.getElementById('jobSubject');
        if (jobSubject) jobSubject.value = `Job Application: ${job.title}`;

        // Update Job Summary Section
        const titleDetail = document.getElementById('jobTitleDetail');
        const expLevel = document.getElementById('jobExpLevel');
        const fullDesc = document.getElementById('jobFullDescription');

        if (titleDetail) titleDetail.textContent = job.title;
        if (expLevel) expLevel.textContent = `About ${job.experience}`;
        
        if (fullDesc) {
            let html = `<p class="mb_20">${job.description}</p>`;
            
            html += `
                <ul class="list clearfix" style="list-style-type: circle; padding-left: 20px;">
                    <li class="mb_10">Collaborate with cross-functional teams to define, design, and ship new features.</li>
                    <li class="mb_10">Unit-test code for robustness, including edge cases, usability, and general reliability.</li>
                    <li class="mb_10">Work on bug fixing and improving application performance.</li>
                    <li class="mb_10">Continuously discover, evaluate, and implement new technologies to maximize development efficiency.</li>
                </ul>
            `;
            fullDesc.innerHTML = html;
        }
    }

    function setupApplyToggle() {
        const applyBtn = document.querySelector('.apply-now-btn');
        const formContainer = document.getElementById('applicationFormContainer');
        
        if (applyBtn && formContainer) {
            applyBtn.addEventListener('click', function() {
                formContainer.style.display = 'block';
                formContainer.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    function setupFormValidation() {
        const form = document.getElementById('application-form');
        const submitBtn = document.getElementById('submitAppBtn');
        const phoneInput = document.getElementById('phoneInput');
        const countrySelect = document.getElementById('countryCode');
        const phoneHint = document.getElementById('phoneHint');
        
        if (!form || !submitBtn) return;

        const validationRules = {
            "+62": { name: "Indonesia", min: 10, max: 13 },
            "+65": { name: "Singapore", min: 8, max: 8 },
            "+1": { name: "USA", min: 10, max: 10 },
            "+44": { name: "UK", min: 10, max: 10 },
            "+91": { name: "India", min: 10, max: 10 },
            "+61": { name: "Australia", min: 9, max: 9 }
        };

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        
        const updatePhoneHint = () => {
            const rule = validationRules[countrySelect.value];
            if (rule) {
                phoneHint.textContent = `Numbers only. Rule: ${rule.min === rule.max ? rule.min : rule.min + '-' + rule.max} digits for ${rule.name}.`;
            }
        };

        const validate = () => {
            let isValid = true;

            inputs.forEach(input => {
                const val = input.value.trim();
                
                if (!val) {
                    isValid = false;
                } else {
                    // Email validation
                    if (input.name === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(val)) isValid = false;
                    }

                    // Phone validation
                    if (input.name === 'phone') {
                        const cleanPhone = val.replace(/\D/g, ''); // Ensure only numbers
                        const rule = validationRules[countrySelect.value];
                        if (rule) {
                            if (cleanPhone.length < rule.min || cleanPhone.length > rule.max) {
                                isValid = false;
                            }
                        } else {
                            if (cleanPhone.length < 8) isValid = false;
                        }
                    }
                }
            });

            // Special check for file input
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
                isValid = false;
            }

            submitBtn.disabled = !isValid;
        };

        // Restrict phone input to numbers only
        phoneInput.addEventListener('keypress', (e) => {
            if (e.which < 48 || e.which > 57) e.preventDefault();
        });

        phoneInput.addEventListener('paste', (e) => {
            const pasteData = e.clipboardData.getData('text');
            if (!/^\d+$/.test(pasteData)) e.preventDefault();
        });

        // Listeners
        inputs.forEach(input => {
            input.addEventListener('input', validate);
        });

        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput) fileInput.addEventListener('change', validate);

        countrySelect.addEventListener('change', () => {
            updatePhoneHint();
            validate();
        });

        updatePhoneHint();
    }
});
