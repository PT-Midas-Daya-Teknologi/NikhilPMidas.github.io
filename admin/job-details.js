document.addEventListener('DOMContentLoaded', function() {
    // Detect Page Reload and force logout
    if (performance.getEntriesByType("navigation")[0].type === 'reload') {
        window.location.href = 'logout.php';
        return;
    }

    const skillSearch = document.getElementById('skillSearch');
    const suggestionsBox = document.getElementById('suggestions');
    const skillsContainer = document.getElementById('skillsContainer');
    const skillsInput = document.getElementById('skillsInput');
    const descriptionTextarea = document.querySelector('textarea[name="description"]');
    const wordCountDisplay = document.getElementById('wordCount');

    let selectedSkills = [];
    try {
        selectedSkills = JSON.parse(skillsInput.value || '[]');
    } catch(e) {
        selectedSkills = [];
    }

    const availableSkills = [
        "React JS", "React Native", "Vue.js", "Angular", "Node.js", 
        "JavaScript", "TypeScript", "Python", "Java", "PHP", 
        "Laravel", "Docker", "AWS", "Figma", "Adobe XD", "SQL", 
        "MongoDB", "Express.js", "Redux", "Bootstrap", "Tailwind CSS",
        "Next.js", "Spring Boot", "Flutter", "Swift", "Kotlin", "Go",
        "DevOps", "Cyber Security", "Machine Learning", "Data Science"
    ];

    function renderSkills() {
        if (!skillsContainer) return;
        skillsContainer.innerHTML = '';
        selectedSkills.forEach((skill, index) => {
            const chip = document.createElement('span');
            chip.className = 'chip chip-lg';
            chip.innerHTML = `
                ${skill}
                <button type="button" class="chip-remove" aria-label="Remove" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="4" y1="4" x2="12" y2="12"></line>
                        <line x1="12" y1="4" x2="4" y2="12"></line>
                    </svg>
                </button>
            `;
            skillsContainer.appendChild(chip);
        });
        skillsInput.value = JSON.stringify(selectedSkills);
    }

    skillsContainer.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('.chip-remove');
        if (removeBtn) {
            const index = removeBtn.getAttribute('data-index');
            selectedSkills.splice(index, 1);
            renderSkills();
        }
    });

    skillSearch.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        if (!value) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const filtered = availableSkills.filter(s => 
            s.toLowerCase().includes(value) && !selectedSkills.includes(s)
        );

        if (filtered.length > 0) {
            suggestionsBox.innerHTML = filtered.map(s => 
                `<div class="suggestion-item" data-value="${s}">${s}</div>`
            ).join('');
            suggestionsBox.style.display = 'block';
            suggestionsBox.style.width = skillSearch.offsetWidth + 'px';
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    suggestionsBox.addEventListener('click', function(e) {
        if (e.target.classList.contains('suggestion-item')) {
            const value = e.target.getAttribute('data-value');
            if (!selectedSkills.includes(value)) {
                selectedSkills.push(value);
                renderSkills();
            }
            skillSearch.value = '';
            suggestionsBox.style.display = 'none';
        }
    });

    // Handle manual skill addition (on Enter)
    skillSearch.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = this.value.trim();
            if (value && !selectedSkills.includes(value)) {
                selectedSkills.push(value);
                renderSkills();
            }
            this.value = '';
            suggestionsBox.style.display = 'none';
        }
    });

    function updateWordCount() {
        if (!descriptionTextarea) return;
        const text = descriptionTextarea.value.trim();
        // Updated word count regex to be more accurate
        const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
        wordCountDisplay.textContent = `${words} words`;
        wordCountDisplay.style.color = words < 15 ? '#dc3545' : '#198754';
    }

    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('input', updateWordCount);
    }

    // Close suggestions on outside click
    document.addEventListener('click', function(e) {
        if (!skillSearch.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    // Initial render
    renderSkills();
    updateWordCount();
});
