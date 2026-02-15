// State management
let resumeData = {
    contact: {},
    summary: '',
    experiences: [],
    education: [],
    skills: {},
    projects: []
};

let experienceCounter = 0;
let educationCounter = 0;
let projectCounter = 0;

let currentAiField = null;
let aiSuggestions = [];

const ACTION_VERBS = ['Achieved', 'Developed', 'Implemented', 'Managed', 'Led', 'Designed', 'Optimized', 'Improved', 'Created', 'Coordinated', 'Enhanced', 'Delivered', 'Streamlined', 'Analyzed', 'Executed', 'Built', 'Architected', 'Established', 'Spearheaded', 'Transformed'];

const QUANTIFICATION_PATTERNS = /\d+%|\d+x|\$\d+|\d+\+/g;

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    loadFromMemory();
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    updatePreview();
    updateProgress();
    calculateAiScores();
    startAutoSave();
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initializeEventListeners() {
    // Contact information
    document.getElementById('fullName').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('email').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('phone').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('location').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('linkedin').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('portfolio').addEventListener('input', debounce(updatePreview, 300));

    // Professional summary
    const summaryField = document.getElementById('summary');
    summaryField.addEventListener('input', function () {
        document.getElementById('summaryCount').textContent = this.value.length;
        debounce(updatePreview, 300)();
    });

    // Skills
    document.getElementById('technicalSkills').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('softSkills').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('certifications').addEventListener('input', debounce(updatePreview, 300));
    document.getElementById('languages').addEventListener('input', debounce(updatePreview, 300));

    // Buttons
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
    document.getElementById('downloadDocxBtn').addEventListener('click', downloadDOCX);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('loadBtn').addEventListener('click', loadFromMemory);
    document.getElementById('fillSampleBtn').addEventListener('click', fillSampleData);

    // New Buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
        saveToMemory();
        alert('Resume saved successfully!');
    });


    document.getElementById('templatesBtn').addEventListener('click', () => {
        saveToMemory();
        window.open('templates.html', '_blank');
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + 'Content');
    const toggle = document.getElementById(sectionId + 'Toggle');

    content.classList.toggle('collapsed');
    toggle.classList.toggle('rotated');
}

function toggleTips() {
    const content = document.getElementById('tipsContent');
    const chevron = document.getElementById('tipsChevron');

    content.classList.toggle('collapsed');
    chevron.classList.toggle('rotated');
}

function showKeywords() {
    document.getElementById('keywordsModal').classList.add('active');
}

function closeKeywords() {
    document.getElementById('keywordsModal').classList.remove('active');
}

// Work Experience Functions
function addExperience() {
    experienceCounter++;
    const experienceList = document.getElementById('experienceList');

    const entryDiv = document.createElement('div');
    entryDiv.className = 'experience-entry';
    entryDiv.id = `experience-${experienceCounter}`;
    entryDiv.innerHTML = `
        <div class="entry-header">
            <h4>Work Experience #${experienceCounter}</h4>
            <button type="button" class="btn btn-danger btn-remove" onclick="removeExperience(${experienceCounter})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Job Title <span class="required">*</span></label>
                <input type="text" class="form-control" data-field="title" placeholder="Senior Software Engineer">
            </div>
            <div class="form-group">
                <label class="form-label">Company Name <span class="required">*</span></label>
                <input type="text" class="form-control" data-field="company" placeholder="Tech Corp">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Location <span class="required">*</span></label>
                <input type="text" class="form-control" data-field="location" placeholder="San Francisco, CA">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="text" class="form-control" data-field="startDate" placeholder="MM/YYYY">
            </div>
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="text" class="form-control" data-field="endDate" placeholder="MM/YYYY">
                <div class="checkbox-group">
                    <input type="checkbox" id="present-${experienceCounter}" data-field="present">
                    <label for="present-${experienceCounter}">Currently working here</label>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Achievements</label>
            <div class="achievements-list" id="achievements-${experienceCounter}"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addAchievement(${experienceCounter})">
                <i class="fas fa-plus"></i> Add Achievement
            </button>
        </div>
    `;

    experienceList.appendChild(entryDiv);
    addAchievement(experienceCounter);

    // Add event listeners
    entryDiv.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', debounce(updatePreview, 300));
    });

    updatePreview();
}

function removeExperience(id) {
    if (confirm('Are you sure you want to remove this work experience?')) {
        document.getElementById(`experience-${id}`).remove();
        updatePreview();
    }
}

function addAchievement(expId) {
    const achievementsList = document.getElementById(`achievements-${expId}`);
    const achievementId = Date.now();

    const achievementDiv = document.createElement('div');
    achievementDiv.className = 'achievement-item';
    achievementDiv.innerHTML = `
        <input type="text" class="form-control" data-field="achievement" data-achievement-id="${achievementId}" placeholder="Developed microservices architecture reducing API response time by 45%">
        <button type="button" class="btn btn-sm btn-secondary ai-suggest-btn" onclick="suggestImprovement('achievement', '${achievementId}')" style="margin: 0 0.5rem;">
            <i class="fas fa-magic"></i>
        </button>
        <button type="button" class="btn btn-danger btn-remove-achievement" onclick="this.parentElement.remove(); updatePreview();">
            <i class="fas fa-times"></i>
        </button>
    `;

    achievementsList.appendChild(achievementDiv);

    achievementDiv.querySelector('input').addEventListener('input', debounce(updatePreview, 300));
}

// Education Functions
function addEducation() {
    educationCounter++;
    const educationList = document.getElementById('educationList');

    const entryDiv = document.createElement('div');
    entryDiv.className = 'education-entry';
    entryDiv.id = `education-${educationCounter}`;
    entryDiv.innerHTML = `
        <div class="entry-header">
            <h4>Education #${educationCounter}</h4>
            <button type="button" class="btn btn-danger btn-remove" onclick="removeEducation(${educationCounter})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Degree/Program <span class="required">*</span></label>
                <input type="text" class="form-control" data-field="degree" placeholder="Bachelor of Science in Computer Science">
            </div>
            <div class="form-group">
                <label class="form-label">Institution <span class="required">*</span></label>
                <input type="text" class="form-control" data-field="institution" placeholder="University of California">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Graduation Date</label>
                <input type="text" class="form-control" data-field="graduation" placeholder="MM/YYYY">
            </div>
            <div class="form-group">
                <label class="form-label">GPA (Optional)</label>
                <input type="text" class="form-control" data-field="gpa" placeholder="3.8">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Honors/Awards (Optional)</label>
            <input type="text" class="form-control" data-field="honors" placeholder="Dean's List, Summa Cum Laude">
        </div>
    `;

    educationList.appendChild(entryDiv);

    // Add event listeners
    entryDiv.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', debounce(updatePreview, 300));
    });

    updatePreview();
}

function removeEducation(id) {
    if (confirm('Are you sure you want to remove this education entry?')) {
        document.getElementById(`education-${id}`).remove();
        updatePreview();
    }
}

// Project Functions
function addProject() {
    projectCounter++;
    const projectsList = document.getElementById('projectsList');

    const entryDiv = document.createElement('div');
    entryDiv.className = 'project-entry';
    entryDiv.id = `project-${projectCounter}`;
    entryDiv.innerHTML = `
        <div class="entry-header">
            <h4>Project #${projectCounter}</h4>
            <button type="button" class="btn btn-danger btn-remove" onclick="removeProject(${projectCounter})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-control" data-field="name" placeholder="E-commerce Platform">
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="3" data-field="description" placeholder="Built a full-stack e-commerce platform using React and Node.js..."></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Technologies Used</label>
                <input type="text" class="form-control" data-field="technologies" placeholder="React, Node.js, MongoDB, Docker">
            </div>
            <div class="form-group">
                <label class="form-label">Project Link (Optional)</label>
                <input type="url" class="form-control" data-field="link" placeholder="https://github.com/username/project">
            </div>
        </div>
    `;

    projectsList.appendChild(entryDiv);

    // Add event listeners
    entryDiv.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', debounce(updatePreview, 300));
    });

    updatePreview();
}

function removeProject(id) {
    if (confirm('Are you sure you want to remove this project?')) {
        document.getElementById(`project-${id}`).remove();
        updatePreview();
    }
}

// Update Preview
function updatePreview() {
    calculateAiScores();
    const resumeContainer = document.getElementById('resumeContainer');

    // Collect data
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const linkedin = document.getElementById('linkedin').value;
    const portfolio = document.getElementById('portfolio').value;
    const summary = document.getElementById('summary').value;

    // If no data, show empty message
    if (!name && !email && !phone && !summary) {
        resumeContainer.innerHTML = '<p class="empty-message">Start filling out the form to see your resume preview here...</p>';
        return;
    }

    let html = '';

    // Header
    if (name || email || phone || location || linkedin || portfolio) {
        html += '<div class="resume-header">';
        if (name) {
            html += `<div class="resume-name">${escapeHtml(name)}</div>`;
        }

        // Build contact items with explicit separators so spaces are preserved
        const contactParts = [];
        if (phone) contactParts.push(escapeHtml(phone));
        if (email) contactParts.push(escapeHtml(email));
        if (location) contactParts.push(escapeHtml(location));
        if (linkedin) contactParts.push(escapeHtml(linkedin));
        if (portfolio) contactParts.push(escapeHtml(portfolio));

        if (contactParts.length > 0) {
            html += '<div class="resume-contact">';
            // Let CSS insert a single separator between items via ::after to avoid duplicates
            html += contactParts.map(p => `<span>${p}</span>`).join('');
            html += '</div>';
        }

        html += '</div>';
    }

    // Professional Summary
    if (summary) {
        html += '<div class="resume-section">';
        html += '<div class="resume-section-title">Professional Summary</div>';
        html += `<div class="resume-summary">${escapeHtml(summary)}</div>`;
        html += '</div>';
    }

    // Work Experience
    const experiences = Array.from(document.querySelectorAll('.experience-entry'));
    if (experiences.length > 0) {
        const hasContent = experiences.some(exp => {
            const title = exp.querySelector('[data-field="title"]').value;
            const company = exp.querySelector('[data-field="company"]').value;
            return title || company;
        });

        if (hasContent) {
            html += '<div class="resume-section">';
            html += '<div class="resume-section-title">Work Experience</div>';

            experiences.forEach(exp => {
                const title = exp.querySelector('[data-field="title"]').value;
                const company = exp.querySelector('[data-field="company"]').value;
                const location = exp.querySelector('[data-field="location"]').value;
                const startDate = exp.querySelector('[data-field="startDate"]').value;
                const endDate = exp.querySelector('[data-field="endDate"]').value;
                const present = exp.querySelector('[data-field="present"]').checked;
                const achievements = Array.from(exp.querySelectorAll('[data-field="achievement"]')).map(a => a.value).filter(a => a);

                if (title || company) {
                    html += '<div class="resume-entry">';
                    html += '<div class="entry-title-row">';
                    html += `<div class="entry-title">${escapeHtml(title)}</div>`;
                    const dateStr = present ? `${startDate} - Present` : `${startDate} - ${endDate}`;
                    if (startDate) {
                        html += `<div class="entry-date">${escapeHtml(dateStr)}</div>`;
                    }
                    html += '</div>';
                    if (company) {
                        html += `<div class="entry-company">${escapeHtml(company)}</div>`;
                    }
                    if (location) {
                        html += `<div class="entry-location">${escapeHtml(location)}</div>`;
                    }
                    if (achievements.length > 0) {
                        html += '<ul class="resume-list">';
                        achievements.forEach(achievement => {
                            html += `<li>${escapeHtml(achievement)}</li>`;
                        });
                        html += '</ul>';
                    }
                    html += '</div>';
                }
            });

            html += '</div>';
        }
    }

    // Education
    const educationEntries = Array.from(document.querySelectorAll('.education-entry'));
    if (educationEntries.length > 0) {
        const hasContent = educationEntries.some(edu => {
            const degree = edu.querySelector('[data-field="degree"]').value;
            const institution = edu.querySelector('[data-field="institution"]').value;
            return degree || institution;
        });

        if (hasContent) {
            html += '<div class="resume-section">';
            html += '<div class="resume-section-title">Education</div>';

            educationEntries.forEach(edu => {
                const degree = edu.querySelector('[data-field="degree"]').value;
                const institution = edu.querySelector('[data-field="institution"]').value;
                const graduation = edu.querySelector('[data-field="graduation"]').value;
                const gpa = edu.querySelector('[data-field="gpa"]').value;
                const honors = edu.querySelector('[data-field="honors"]').value;

                if (degree || institution) {
                    html += '<div class="resume-entry">';
                    html += '<div class="entry-title-row">';
                    html += `<div class="entry-title">${escapeHtml(degree)}</div>`;
                    if (graduation) {
                        html += `<div class="entry-date">${escapeHtml(graduation)}</div>`;
                    }
                    html += '</div>';
                    if (institution) {
                        html += `<div class="entry-company">${escapeHtml(institution)}</div>`;
                    }
                    if (gpa) {
                        html += `<div>GPA: ${escapeHtml(gpa)}</div>`;
                    }
                    if (honors) {
                        html += `<div>${escapeHtml(honors)}</div>`;
                    }
                    html += '</div>';
                }
            });

            html += '</div>';
        }
    }

    // Skills
    const technicalSkills = document.getElementById('technicalSkills').value;
    const softSkills = document.getElementById('softSkills').value;
    const certifications = document.getElementById('certifications').value;
    const languages = document.getElementById('languages').value;

    if (technicalSkills || softSkills || certifications || languages) {
        html += '<div class="resume-section">';
        html += '<div class="resume-section-title">Skills</div>';

        if (technicalSkills) {
            html += '<div><strong>Technical Skills:</strong> <span class="resume-skills">';
            technicalSkills.split(',').forEach(skill => {
                if (skill.trim()) {
                    html += `<span>${escapeHtml(skill.trim())}</span>`;
                }
            });
            html += '</span></div>';
        }

        if (softSkills) {
            html += '<div><strong>Soft Skills:</strong> <span class="resume-skills">';
            softSkills.split(',').forEach(skill => {
                if (skill.trim()) {
                    html += `<span>${escapeHtml(skill.trim())}</span>`;
                }
            });
            html += '</span></div>';
        }

        if (certifications) {
            html += '<div><strong>Certifications:</strong> <span class="resume-skills">';
            certifications.split(',').forEach(cert => {
                if (cert.trim()) {
                    html += `<span>${escapeHtml(cert.trim())}</span>`;
                }
            });
            html += '</span></div>';
        }

        if (languages) {
            html += '<div><strong>Languages:</strong> <span class="resume-skills">';
            languages.split(',').forEach(lang => {
                if (lang.trim()) {
                    html += `<span>${escapeHtml(lang.trim())}</span>`;
                }
            });
            html += '</span></div>';
        }

        html += '</div>';
    }

    // Projects
    const projects = Array.from(document.querySelectorAll('.project-entry'));
    if (projects.length > 0) {
        const hasContent = projects.some(proj => {
            const name = proj.querySelector('[data-field="name"]').value;
            return name;
        });

        if (hasContent) {
            html += '<div class="resume-section">';
            html += '<div class="resume-section-title">Projects</div>';

            projects.forEach(proj => {
                const name = proj.querySelector('[data-field="name"]').value;
                const description = proj.querySelector('[data-field="description"]').value;
                const technologies = proj.querySelector('[data-field="technologies"]').value;
                const link = proj.querySelector('[data-field="link"]').value;

                if (name) {
                    html += '<div class="resume-entry">';
                    html += `<div class="entry-title">${escapeHtml(name)}</div>`;
                    if (description) {
                        html += `<div>${escapeHtml(description)}</div>`;
                    }
                    if (technologies) {
                        html += `<div><strong>Technologies:</strong> ${escapeHtml(technologies)}</div>`;
                    }
                    if (link) {
                        html += `<div><strong>Link:</strong> ${escapeHtml(link)}</div>`;
                    }
                    html += '</div>';
                }
            });

            html += '</div>';
        }
    }

    resumeContainer.innerHTML = html;
    updateProgress();
}

// Preview marquee controls
// Preview note removed (static header in HTML/CSS used instead)

// Download Functions
function downloadPDF() {
    const name = document.getElementById('fullName').value || 'Resume';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Resume_${name.replace(/\s+/g, '_')}_${date}.pdf`;

    const element = document.getElementById('resumeContainer');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            letterRendering: true,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
}

function downloadDOCX() {
    const name = document.getElementById('fullName').value || 'Resume';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Resume_${name.replace(/\s+/g, '_')}_${date}.docx`;

    const element = document.getElementById('resumeContainer');
    const htmlContent = element.innerHTML;

    // html-docx-js does not include CSS-generated content (like ::after).
    // Ensure separators are present explicitly in the HTML used for DOCX conversion.
    // Insert a separator span between adjacent contact <span> elements.
    let docxHtmlContent = htmlContent.replace(/<div class="resume-contact">([\s\S]*?)<\/div>/g, (match, inner) => {
        // If separators already exist, leave as-is. Otherwise insert explicit sep spans.
        if (/class=\"sep\"/.test(inner) || /\|/.test(inner)) {
            return `<div class="resume-contact">${inner}</div>`;
        }
        const withSeps = inner.replace(/<\/span>\s*<span>/g, `</span><span class="sep"> | </span><span>`);
        return `<div class="resume-contact">${withSeps}</div>`;
    });

    // Create a complete HTML document for docx conversion with whitespace preservation
    const completeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Calibri, Arial, sans-serif; 
                    font-size: 11pt; 
                    line-height: 1.4; 
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .resume-name { font-size: 24pt; font-weight: bold; text-align: center; }
                        .resume-contact { 
                            text-align: center; 
                            font-size: 10pt; 
                            margin-bottom: 1em; 
                            white-space: nowrap;
                            letter-spacing: normal;
                        }
                        .resume-contact span { display: inline-block; }
                        /* For docx conversion, explicit .sep spans are inserted between items */
                        .resume-contact .sep { display: inline-block; margin: 0 0.25rem; }
                .resume-section-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 1em; margin-bottom: 0.5em; }
                .entry-title { font-weight: bold; font-size: 12pt; }
                .entry-company { font-weight: 600; }
                ul { margin-left: 1.5em; }
                li { white-space: pre-wrap; margin-bottom: 0.375rem; }
            </style>
        </head>
        <body>${docxHtmlContent}</body>
        </html>
    `;

    const converted = htmlDocx.asBlob(completeHtml);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(converted);
    link.download = filename;
    link.click();
}

// Data Management
function saveToMemory() {
    const formData = {
        contact: {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            linkedin: document.getElementById('linkedin').value,
            portfolio: document.getElementById('portfolio').value
        },
        summary: document.getElementById('summary').value,
        skills: {
            technical: document.getElementById('technicalSkills').value,
            soft: document.getElementById('softSkills').value,
            certifications: document.getElementById('certifications').value,
            languages: document.getElementById('languages').value
        },
        experiences: [],
        education: [],
        projects: []
    };

    // Save experiences
    document.querySelectorAll('.experience-entry').forEach(exp => {
        const expData = {
            title: exp.querySelector('[data-field="title"]').value,
            company: exp.querySelector('[data-field="company"]').value,
            location: exp.querySelector('[data-field="location"]').value,
            startDate: exp.querySelector('[data-field="startDate"]').value,
            endDate: exp.querySelector('[data-field="endDate"]').value,
            present: exp.querySelector('[data-field="present"]').checked,
            achievements: Array.from(exp.querySelectorAll('[data-field="achievement"]')).map(a => a.value)
        };
        formData.experiences.push(expData);
    });

    // Save education
    document.querySelectorAll('.education-entry').forEach(edu => {
        const eduData = {
            degree: edu.querySelector('[data-field="degree"]').value,
            institution: edu.querySelector('[data-field="institution"]').value,
            graduation: edu.querySelector('[data-field="graduation"]').value,
            gpa: edu.querySelector('[data-field="gpa"]').value,
            honors: edu.querySelector('[data-field="honors"]').value
        };
        formData.education.push(eduData);
    });

    // Save projects
    document.querySelectorAll('.project-entry').forEach(proj => {
        const projData = {
            name: proj.querySelector('[data-field="name"]').value,
            description: proj.querySelector('[data-field="description"]').value,
            technologies: proj.querySelector('[data-field="technologies"]').value,
            link: proj.querySelector('[data-field="link"]').value
        };
        formData.projects.push(projData);
    });

    resumeData = formData;

    // Save to localStorage
    localStorage.setItem('atsResumeData', JSON.stringify(resumeData));

    const now = new Date().toLocaleString();
    document.getElementById('lastSaved').textContent = `Last saved: ${now}`;
}

function loadFromMemory() {
    // Try loading from localStorage first
    const savedData = localStorage.getItem('atsResumeData');
    if (savedData) {
        try {
            resumeData = JSON.parse(savedData);
        } catch (e) {
            console.error('Error parsing saved resume data:', e);
        }
    }

    if (!resumeData.contact.fullName && experienceCounter === 0) {
        return;
    }

    // Load contact
    document.getElementById('fullName').value = resumeData.contact.fullName || '';
    document.getElementById('email').value = resumeData.contact.email || '';
    document.getElementById('phone').value = resumeData.contact.phone || '';
    document.getElementById('location').value = resumeData.contact.location || '';
    document.getElementById('linkedin').value = resumeData.contact.linkedin || '';
    document.getElementById('portfolio').value = resumeData.contact.portfolio || '';

    // Load summary
    document.getElementById('summary').value = resumeData.summary || '';
    document.getElementById('summaryCount').textContent = resumeData.summary?.length || 0;

    // Load skills
    document.getElementById('technicalSkills').value = resumeData.skills?.technical || '';
    document.getElementById('softSkills').value = resumeData.skills?.soft || '';
    document.getElementById('certifications').value = resumeData.skills?.certifications || '';
    document.getElementById('languages').value = resumeData.skills?.languages || '';

    // Load experiences
    document.getElementById('experienceList').innerHTML = '';
    experienceCounter = 0;
    if (resumeData.experiences) {
        resumeData.experiences.forEach(exp => {
            addExperience();
            const expEntry = document.querySelector(`#experience-${experienceCounter}`);
            expEntry.querySelector('[data-field="title"]').value = exp.title || '';
            expEntry.querySelector('[data-field="company"]').value = exp.company || '';
            expEntry.querySelector('[data-field="location"]').value = exp.location || '';
            expEntry.querySelector('[data-field="startDate"]').value = exp.startDate || '';
            expEntry.querySelector('[data-field="endDate"]').value = exp.endDate || '';
            expEntry.querySelector('[data-field="present"]').checked = exp.present || false;

            const achievementsList = expEntry.querySelector(`#achievements-${experienceCounter}`);
            achievementsList.innerHTML = '';
            if (exp.achievements) {
                exp.achievements.forEach((achievement, idx) => {
                    if (idx === 0 && achievementsList.children.length === 0) {
                        addAchievement(experienceCounter);
                    } else if (idx > 0) {
                        addAchievement(experienceCounter);
                    }
                    const inputs = achievementsList.querySelectorAll('[data-field="achievement"]');
                    if (inputs[idx]) {
                        inputs[idx].value = achievement;
                    }
                });
            }
        });
    }

    // Load education
    document.getElementById('educationList').innerHTML = '';
    educationCounter = 0;
    if (resumeData.education) {
        resumeData.education.forEach(edu => {
            addEducation();
            const eduEntry = document.querySelector(`#education-${educationCounter}`);
            eduEntry.querySelector('[data-field="degree"]').value = edu.degree || '';
            eduEntry.querySelector('[data-field="institution"]').value = edu.institution || '';
            eduEntry.querySelector('[data-field="graduation"]').value = edu.graduation || '';
            eduEntry.querySelector('[data-field="gpa"]').value = edu.gpa || '';
            eduEntry.querySelector('[data-field="honors"]').value = edu.honors || '';
        });
    }

    // Load projects
    document.getElementById('projectsList').innerHTML = '';
    projectCounter = 0;
    if (resumeData.projects) {
        resumeData.projects.forEach(proj => {
            addProject();
            const projEntry = document.querySelector(`#project-${projectCounter}`);
            projEntry.querySelector('[data-field="name"]').value = proj.name || '';
            projEntry.querySelector('[data-field="description"]').value = proj.description || '';
            projEntry.querySelector('[data-field="technologies"]').value = proj.technologies || '';
            projEntry.querySelector('[data-field="link"]').value = proj.link || '';
        });
    }

    updatePreview();
}

function clearForm() {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        document.getElementById('resumeForm').reset();
        document.getElementById('experienceList').innerHTML = '';
        document.getElementById('educationList').innerHTML = '';
        document.getElementById('projectsList').innerHTML = '';
        experienceCounter = 0;
        educationCounter = 0;
        projectCounter = 0;
        resumeData = {
            contact: {},
            summary: '',
            experiences: [],
            education: [],
            skills: {},
            projects: []
        };
        document.getElementById('summaryCount').textContent = '0';
        updatePreview();
    }
}

function fillSampleData() {
    // Contact
    document.getElementById('fullName').value = 'John Developer';
    document.getElementById('email').value = 'john.developer@email.com';
    document.getElementById('phone').value = '(555) 123-4567';
    document.getElementById('location').value = 'San Francisco, CA';
    document.getElementById('linkedin').value = 'linkedin.com/in/johndeveloper';
    document.getElementById('portfolio').value = 'github.com/johndeveloper';

    // Summary
    document.getElementById('summary').value = 'Full-stack software engineer with 5+ years of experience building scalable web applications. Specialized in JavaScript, React, and Node.js. Proven track record of improving application performance by 40% and reducing load times.';
    document.getElementById('summaryCount').textContent = document.getElementById('summary').value.length;

    // Skills
    document.getElementById('technicalSkills').value = 'JavaScript, Python, React, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS, Git';
    document.getElementById('softSkills').value = 'Team Leadership, Agile Methodologies, Problem Solving, Communication';
    document.getElementById('certifications').value = 'AWS Certified Solutions Architect, Certified Scrum Master';
    document.getElementById('languages').value = 'English (Native), Spanish (Intermediate)';

    // Add work experience 1
    addExperience();
    let expEntry = document.querySelector(`#experience-${experienceCounter}`);
    expEntry.querySelector('[data-field="title"]').value = 'Senior Software Engineer';
    expEntry.querySelector('[data-field="company"]').value = 'Tech Corp';
    expEntry.querySelector('[data-field="location"]').value = 'San Francisco, CA';
    expEntry.querySelector('[data-field="startDate"]').value = '06/2021';
    expEntry.querySelector('[data-field="present"]').checked = true;

    const achievements1 = expEntry.querySelector(`#achievements-${experienceCounter}`);
    achievements1.querySelector('[data-field="achievement"]').value = 'Developed microservices architecture reducing API response time by 45%';
    addAchievement(experienceCounter);
    const ach1Inputs = achievements1.querySelectorAll('[data-field="achievement"]');
    ach1Inputs[1].value = 'Led team of 4 engineers in rebuilding customer dashboard using React';
    addAchievement(experienceCounter);
    ach1Inputs[2].value = 'Implemented CI/CD pipeline cutting deployment time from 2 hours to 15 minutes';

    // Add work experience 2
    addExperience();
    expEntry = document.querySelector(`#experience-${experienceCounter}`);
    expEntry.querySelector('[data-field="title"]').value = 'Software Engineer';
    expEntry.querySelector('[data-field="company"]').value = 'StartUp Inc';
    expEntry.querySelector('[data-field="location"]').value = 'San Jose, CA';
    expEntry.querySelector('[data-field="startDate"]').value = '01/2019';
    expEntry.querySelector('[data-field="endDate"]').value = '05/2021';

    const achievements2 = expEntry.querySelector(`#achievements-${experienceCounter}`);
    achievements2.querySelector('[data-field="achievement"]').value = 'Built RESTful APIs serving 100K+ daily active users';
    addAchievement(experienceCounter);
    const ach2Inputs = achievements2.querySelectorAll('[data-field="achievement"]');
    ach2Inputs[1].value = 'Optimized database queries improving application performance by 30%';
    addAchievement(experienceCounter);
    ach2Inputs[2].value = 'Collaborated with UX team to redesign mobile app (4.8 star rating)';

    // Add education
    addEducation();
    const eduEntry = document.querySelector(`#education-${educationCounter}`);
    eduEntry.querySelector('[data-field="degree"]').value = 'Bachelor of Science in Computer Science';
    eduEntry.querySelector('[data-field="institution"]').value = 'University of California';
    eduEntry.querySelector('[data-field="graduation"]').value = '05/2018';
    eduEntry.querySelector('[data-field="gpa"]').value = '3.8';
    eduEntry.querySelector('[data-field="honors"]').value = 'Dean\'s List, Summa Cum Laude';

    updatePreview();
}

function updateProgress() {
    const requiredFields = [
        document.getElementById('fullName').value,
        document.getElementById('email').value,
        document.getElementById('phone').value,
        document.getElementById('location').value,
        document.getElementById('summary').value
    ];

    let filledRequired = requiredFields.filter(f => f).length;
    let totalRequired = requiredFields.length;

    // Check for at least one work experience
    const hasExperience = document.querySelectorAll('.experience-entry').length > 0;
    if (hasExperience) filledRequired++;
    totalRequired++;

    // Check for at least one education
    const hasEducation = document.querySelectorAll('.education-entry').length > 0;
    if (hasEducation) filledRequired++;
    totalRequired++;

    // Check for skills
    if (document.getElementById('technicalSkills').value) filledRequired++;
    totalRequired++;

    const progress = Math.round((filledRequired / totalRequired) * 100);
    document.getElementById('progressText').textContent = `Resume ${progress}% Complete`;
}

function startAutoSave() {
    setInterval(() => {
        saveToMemory();
    }, 3000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// AI Suggestion Functions
async function suggestImprovement(fieldType, achievementId = null) {
    currentAiField = { type: fieldType, id: achievementId };

    let textToAnalyze = '';

    if (fieldType === 'summary') {
        textToAnalyze = document.getElementById('summary').value;
    } else if (fieldType === 'achievement' && achievementId) {
        const input = document.querySelector(`[data-achievement-id="${achievementId}"]`);
        if (input) {
            textToAnalyze = input.value;
        }
    }

    if (!textToAnalyze.trim()) {
        alert('Please enter some text before requesting AI suggestions.');
        return;
    }

    // Show modal with loading state
    document.getElementById('aiModal').classList.add('active');
    document.getElementById('aiSuggestionsContent').innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing your text...</p>
        </div>
    `;

    try {
        // Call LanguageTool API
        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `text=${encodeURIComponent(textToAnalyze)}&language=en-US`
        });

        const data = await response.json();
        aiSuggestions = data.matches || [];

        // Generate additional suggestions based on field type
        const enhancedSuggestions = generateEnhancedSuggestions(textToAnalyze, fieldType, aiSuggestions);

        displayAiSuggestions(textToAnalyze, enhancedSuggestions);
    } catch (error) {
        console.error('AI suggestion error:', error);
        document.getElementById('aiSuggestionsContent').innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to fetch suggestions. Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

function generateEnhancedSuggestions(text, fieldType, grammarSuggestions) {
    const suggestions = [...grammarSuggestions];

    if (fieldType === 'achievement') {
        // Check for action verbs
        const firstWord = text.trim().split(' ')[0];
        const hasActionVerb = ACTION_VERBS.some(verb => firstWord.toLowerCase() === verb.toLowerCase());

        if (!hasActionVerb) {
            const suggestedVerb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
            suggestions.push({
                message: 'Start with a strong action verb',
                shortMessage: 'Action verb needed',
                replacements: [{ value: `${suggestedVerb} ${text}` }],
                rule: { issueType: 'enhancement', category: { name: 'Action Verbs' } },
                context: { text: text, offset: 0, length: firstWord.length }
            });
        }

        // Check for quantification
        const hasNumbers = QUANTIFICATION_PATTERNS.test(text);
        if (!hasNumbers) {
            suggestions.push({
                message: 'Consider adding metrics or numbers to quantify your impact (e.g., "by 40%", "for 100+ users")',
                shortMessage: 'Add quantification',
                replacements: [{ value: text + ' (Add specific metrics here)' }],
                rule: { issueType: 'enhancement', category: { name: 'Quantification' } },
                context: { text: text, offset: text.length, length: 0 }
            });
        }
    }

    if (fieldType === 'summary') {
        // Check length
        if (text.length < 100) {
            suggestions.push({
                message: 'Professional summaries are typically 150-300 characters. Consider expanding with more details about your experience.',
                shortMessage: 'Summary too short',
                replacements: [],
                rule: { issueType: 'style', category: { name: 'Length' } },
                context: { text: text, offset: 0, length: text.length }
            });
        }
    }

    return suggestions;
}

function displayAiSuggestions(originalText, suggestions) {
    const content = document.getElementById('aiSuggestionsContent');

    if (suggestions.length === 0) {
        content.innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-check-circle"></i>
                <p>Great! No issues found. Your text looks professional.</p>
            </div>
        `;
        return;
    }

    let html = '';

    suggestions.forEach((suggestion, index) => {
        const issueType = suggestion.rule?.issueType || 'grammar';
        const message = suggestion.message || suggestion.shortMessage || 'Improvement suggested';
        const hasReplacement = suggestion.replacements && suggestion.replacements.length > 0;

        html += `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <span class="suggestion-type ${issueType}">${issueType.toUpperCase()}</span>
                </div>
                <p style="margin-bottom: 1rem; color: var(--color-text-secondary);">${escapeHtml(message)}</p>
        `;

        if (hasReplacement) {
            const replacement = suggestion.replacements[0].value;
            html += `
                <div class="text-comparison">
                    <div class="text-label">Current:</div>
                    <div class="original-text">${escapeHtml(originalText)}</div>
                    <div class="text-label">Suggested:</div>
                    <div class="suggested-text">${escapeHtml(replacement)}</div>
                </div>
                <div class="suggestion-actions">
                    <button class="btn btn-sm btn-secondary" onclick="rejectSuggestion(${index})">Reject</button>
                    <button class="btn btn-sm btn-primary" onclick="acceptSuggestion('${escapeHtml(replacement).replace(/'/g, "\\'")}')">Accept</button>
                </div>
            `;
        } else {
            html += `
                <div class="suggestion-actions">
                    <button class="btn btn-sm btn-secondary" onclick="closeAiModal()">Dismiss</button>
                </div>
            `;
        }

        html += '</div>';
    });

    content.innerHTML = html;
}

function acceptSuggestion(suggestedText) {
    if (!currentAiField) return;

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = suggestedText;
    const decodedText = textarea.value;

    if (currentAiField.type === 'summary') {
        document.getElementById('summary').value = decodedText;
        document.getElementById('summaryCount').textContent = decodedText.length;
    } else if (currentAiField.type === 'achievement' && currentAiField.id) {
        const input = document.querySelector(`[data-achievement-id="${currentAiField.id}"]`);
        if (input) {
            input.value = decodedText;
        }
    }

    updatePreview();
    calculateAiScores();
    closeAiModal();
}

function rejectSuggestion(index) {
    // Simply close without applying
    closeAiModal();
}

function closeAiModal() {
    document.getElementById('aiModal').classList.remove('active');
    currentAiField = null;
}

// AI Score Calculation
function calculateAiScores() {
    const summary = document.getElementById('summary').value;
    const experiences = Array.from(document.querySelectorAll('[data-field="achievement"]')).map(el => el.value).filter(v => v);

    let professionalismScore = 0;
    let actionVerbScore = 0;
    let quantificationScore = 0;

    // Professional summary check
    if (summary.length >= 150 && summary.length <= 400) {
        professionalismScore += 40;
    } else if (summary.length > 0) {
        professionalismScore += 20;
    }

    // Check action verbs in achievements
    let actionVerbCount = 0;
    experiences.forEach(exp => {
        const firstWord = exp.trim().split(' ')[0];
        if (ACTION_VERBS.some(verb => firstWord.toLowerCase() === verb.toLowerCase())) {
            actionVerbCount++;
        }
    });

    if (experiences.length > 0) {
        actionVerbScore = Math.min(100, (actionVerbCount / experiences.length) * 100);
    }

    // Check quantification
    let quantifiedCount = 0;
    experiences.forEach(exp => {
        if (QUANTIFICATION_PATTERNS.test(exp)) {
            quantifiedCount++;
        }
    });

    if (experiences.length > 0) {
        quantificationScore = Math.min(100, (quantifiedCount / experiences.length) * 100);
    }

    // Additional professionalism checks
    const hasContact = document.getElementById('fullName').value &&
        document.getElementById('email').value &&
        document.getElementById('phone').value;
    if (hasContact) professionalismScore += 30;

    const hasEducation = document.querySelectorAll('.education-entry').length > 0;
    if (hasEducation) professionalismScore += 15;

    const hasSkills = document.getElementById('technicalSkills').value;
    if (hasSkills) professionalismScore += 15;

    professionalismScore = Math.min(100, professionalismScore);

    // Calculate overall
    const overallScore = Math.round((professionalismScore + actionVerbScore + quantificationScore) / 3);

    // Update UI
    updateScoreDisplay('overallScore', overallScore);
    updateScoreDisplay('professionalismScore', Math.round(professionalismScore));
    updateScoreDisplay('actionVerbScore', Math.round(actionVerbScore));
    updateScoreDisplay('quantificationScore', Math.round(quantificationScore));
}

function updateScoreDisplay(elementId, score) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = score + '%';

    // Update score item container class
    const itemId = elementId.replace('Score', 'ScoreItem');
    const itemElement = document.getElementById(itemId);
    if (itemElement) {
        itemElement.classList.remove('excellent', 'good', 'needs-work');

        if (score >= 85) {
            itemElement.classList.add('excellent');
        } else if (score >= 70) {
            itemElement.classList.add('good');
        } else {
            itemElement.classList.add('needs-work');
        }
    }

    // Update progress bar
    const fillId = elementId.replace('Score', 'ScoreFill');
    const fillElement = document.getElementById(fillId);
    if (fillElement) {
        fillElement.style.width = score + '%';
    }
}