// Templates Data Structure
const templates = [
    { id: 'template-1', name: 'Standard ATS', class: 'template-1' },
    { id: 'template-2', name: 'Modern Tech', class: 'template-2' },
    { id: 'template-3', name: 'Minimalist', class: 'template-3' },
    { id: 'template-4', name: 'Corporate Blue', class: 'template-4' },
    { id: 'template-5', name: 'Executive', class: 'template-5' },
    { id: 'template-6', name: 'Creative', class: 'template-6' },
    { id: 'template-7', name: 'Compact', class: 'template-7' },
    { id: 'template-8', name: 'Two Column', class: 'template-8' }, // Requires grid support in renderer
    { id: 'template-9', name: 'Timeline', class: 'template-9' },
    { id: 'template-10', name: 'Ivy League', class: 'template-10' }
];

let currentTemplateId = 'template-1';
let resumeData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTemplateList();
    renderResume(); // Render default

    const pdfBtn = document.getElementById('downloadPdfBtn');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadPDF);

    const docxBtn = document.getElementById('downloadDocxBtn');
    if (docxBtn) docxBtn.addEventListener('click', downloadDOCX);

    // Theme Toggle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function loadData() {
    const savedData = localStorage.getItem('atsResumeData');
    if (savedData) {
        try {
            resumeData = JSON.parse(savedData);
        } catch (e) {
            console.error('Error parsing resume data:', e);
            alert('Error loading resume data. Please go back to the editor and save again.');
        }
    } else {
        alert('No resume data found. Please go back to the editor and save your resume first.');
    }
}

function renderTemplateList() {
    const list = document.getElementById('templateList');
    list.innerHTML = '';

    templates.forEach(t => {
        const item = document.createElement('div');
        item.className = `template-card ${t.id === currentTemplateId ? 'active' : ''}`;
        item.onclick = () => selectTemplate(t.id);

        // Simple visual placeholder for thumbnail
        const thumbMock = document.createElement('div');
        thumbMock.className = 'template-thumb';
        thumbMock.innerHTML = `<span style="font-size: 0.5em; color: #999;">${t.name}</span>`;

        const name = document.createElement('div');
        name.className = 'template-name';
        name.textContent = t.name;

        item.appendChild(thumbMock);
        item.appendChild(name);
        list.appendChild(item);
    });
}

function selectTemplate(id) {
    currentTemplateId = id;
    renderTemplateList(); // Re-render to update active state
    renderResume();
}

function getSafeValue(val) {
    return val ? val.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}


function renderResume() {
    const container = document.getElementById('resumePreview');
    const template = templates.find(t => t.id === currentTemplateId);

    container.className = `resume-preview ${template.class}`;
    container.innerHTML = ''; // Clear current

    // --- 1. Generate Content for Each Section ---

    // Contact Info (Header)
    const c = resumeData.contact || {};
    let headerHtml = '';
    if (c.fullName) headerHtml += `<h1>${getSafeValue(c.fullName)}</h1>`;

    headerHtml += '<div class="contact-info">';
    const contactParts = [];
    if (c.phone) contactParts.push(getSafeValue(c.phone));
    if (c.email) contactParts.push(getSafeValue(c.email));
    if (c.location) contactParts.push(getSafeValue(c.location));
    if (c.linkedin) contactParts.push(getSafeValue(c.linkedin));

    // Join with separator. Template 6 aligns right, others center/left. 
    headerHtml += contactParts.map(p => `<span>${p}</span>`).join(' | ');
    headerHtml += '</div>';

    // Summary
    let summaryHtml = '';
    if (resumeData.summary) {
        summaryHtml += `<div class="section-title">Professional Summary</div>`;
        summaryHtml += `<p>${getSafeValue(resumeData.summary)}</p>`;
    }

    // Work Experience
    let experienceHtml = '';
    if (resumeData.experiences && resumeData.experiences.length > 0) {
        experienceHtml += `<div class="section-title">Work Experience</div>`;
        resumeData.experiences.forEach(exp => {
            experienceHtml += `<div class="entry">`;

            // Layout specific variations
            if (template.id === 'template-10') {
                experienceHtml += `<div class="job-row">
                          <span class="job-title">${getSafeValue(exp.title)}</span>
                          <span class="date">${getSafeValue(exp.startDate)} - ${exp.present ? 'Present' : getSafeValue(exp.endDate)}</span>
                        </div>`;
                experienceHtml += `<div class="job-company">${getSafeValue(exp.company)}, ${getSafeValue(exp.location)}</div>`;

            } else {
                experienceHtml += `<div class="job-header">
                            <span class="job-title">${getSafeValue(exp.title)}</span>
                            <span class="date">${getSafeValue(exp.startDate)} - ${exp.present ? 'Present' : getSafeValue(exp.endDate)}</span>
                         </div>`;
                experienceHtml += `<div class="company-name">${getSafeValue(exp.company)} - ${getSafeValue(exp.location)}</div>`;
            }

            if (exp.achievements && exp.achievements.length > 0) {
                experienceHtml += `<ul>`;
                exp.achievements.forEach(ach => {
                    if (ach) experienceHtml += `<li>${getSafeValue(ach)}</li>`;
                });
                experienceHtml += `</ul>`;
            }
            experienceHtml += `</div>`;
        });
    }

    // Projects
    let projectsHtml = '';
    if (resumeData.projects && resumeData.projects.length > 0) {
        const hasProj = resumeData.projects.some(p => p.name);
        if (hasProj) {
            projectsHtml += `<div class="section-title">Projects</div>`;
            resumeData.projects.forEach(proj => {
                if (!proj.name) return;
                projectsHtml += `<div class="entry">`;
                projectsHtml += `<div class="job-header">
                            <span class="job-title">${getSafeValue(proj.name)}</span>
                         </div>`;
                if (proj.description) projectsHtml += `<p>${getSafeValue(proj.description)}</p>`;
                if (proj.technologies) projectsHtml += `<p><strong>Technologies:</strong> ${getSafeValue(proj.technologies)}</p>`;
                projectsHtml += `</div>`;
            });
        }
    }

    // Education
    let educationHtml = '';
    if (resumeData.education && resumeData.education.length > 0) {
        educationHtml += `<div class="section-title">Education</div>`;
        resumeData.education.forEach(edu => {
            educationHtml += `<div class="entry">`;
            educationHtml += `<div class="job-title">${getSafeValue(edu.degree)}</div>`;
            educationHtml += `<div>${getSafeValue(edu.institution)}</div>`;
            if (edu.graduation) educationHtml += `<div class="date">${getSafeValue(edu.graduation)}</div>`;
            educationHtml += `</div>`;
        });
    }

    // Skills
    let skillsHtml = '';
    const s = resumeData.skills || {};
    if (s.technical || s.soft || s.languages) {
        skillsHtml += `<div class="section-title">Skills</div>`;
        if (s.technical) skillsHtml += `<p><strong>Technical:</strong> ${getSafeValue(s.technical)}</p>`;
        if (s.soft) skillsHtml += `<p><strong>Soft Skills:</strong> ${getSafeValue(s.soft)}</p>`;
        if (s.languages) skillsHtml += `<p><strong>Languages:</strong> ${getSafeValue(s.languages)}</p>`;
    }


    // --- 2. Assemble Layout based on Template ID ---

    if (template.id === 'template-2') {
        // Modern Tech: Header (Top), Left Col (Edu, Skills), Right Col (Summ, Exp, Proj)
        container.innerHTML = `
            <header>${headerHtml}</header>
            <div class="left-col">
                ${educationHtml}
                ${skillsHtml}
            </div>
            <div class="right-col">
                ${summaryHtml}
                ${experienceHtml}
                ${projectsHtml}
            </div>
        `;
    }
    else if (template.id === 'template-8') {
        // Two Column: Vertical Split. Left (Contact, Skills, Edu), Right (Name, Summ, Exp, Proj)
        // Note: Template 8 CSS needs to handle the lack of a top header wrapper now.
        // We will move the Name/Header parts into the Right Column (Main) for a distinct look,
        // OR keep Contact/Skills/Edu in Left Side.
        // Let's go with: Left Sidebar (Contact Info, Key Skills, Education), Right Main (Name, Quote/Summary, Work History).

        // Re-generating header parts for split layout if needed, or just reusing.
        // For T8, we want Contact Info in the sidebar, Name in Main.

        // T8 Header HTML reuse needs adjustment.
        let t8SideContact = `<div class="contact-info-vertical">`;
        t8SideContact += contactParts.map(p => `<div>${p}</div>`).join('');
        t8SideContact += `</div>`;

        let t8MainHeader = `<h1>${getSafeValue(c.fullName)}</h1>`;

        container.innerHTML = `
            <div class="side-col">
                <!-- Side Col Content -->
                <div class="section-title">Contact</div>
                ${t8SideContact}
                ${skillsHtml}
                ${educationHtml}
            </div>
            <div class="main-col">
                <!-- Main Col Content -->
                <header style="margin-bottom: 20px; border-bottom: none;">${t8MainHeader}</header>
                ${summaryHtml}
                ${experienceHtml}
                ${projectsHtml}
            </div>
        `;
    }
    else {
        // Standard Layout (Linear)
        container.innerHTML = `
            <header>${headerHtml}</header>
            ${summaryHtml}
            ${experienceHtml}
            ${projectsHtml}
            ${educationHtml}
            ${skillsHtml}
        `;
    }
}


function downloadPDF() {
    const element = document.getElementById('resumePreview');
    const c = resumeData.contact || {};
    const name = c.fullName ? c.fullName.replace(/\s+/g, '_') : 'Resume';

    const opt = {
        margin: [0, 0, 0, 0], // Zero margins because the CSS handles padding
        filename: `${name}_${currentTemplateId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

function downloadDOCX() {
    const content = document.getElementById('resumePreview').innerHTML;
    const c = resumeData.contact || {};
    const name = c.fullName ? c.fullName.replace(/\s+/g, '_') : 'Resume';

    // Retrieve associated CSS for the current template
    // We need to inline some styles because html-docx-js is limited
    // But basic class support exists if we provide the style block.

    // We will verify if we can fetch the styles from templates.css or just construct a basic style block.
    // Making a robust export matches the specific template structure.

    const css = `
        <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
            h1 { font-size: 24pt; font-weight: bold; margin-bottom: 10px; }
            .section-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 20px; margin-bottom: 10px; }
            .job-header { font-weight: bold; font-size: 12pt; display: flex; justify-content: space-between; }
            .job-title { font-weight: bold; }
            .company-name { font-style: italic; }
            .date { float: right; }
        </style>
    `;

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${css}
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;

    const converted = htmlDocx.asBlob(fullHtml);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(converted);
    link.download = `${name}_${currentTemplateId}.docx`;
    link.click();
}
