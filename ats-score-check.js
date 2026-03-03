// PDF.js worker setup
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let currentResumeText = '';
let currentJobDescription = '';
let analysisResults = {};

// Theme Toggle
document.addEventListener('DOMContentLoaded', () => {
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

    // Drag and drop
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('active');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('active');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function triggerFileInput() {
    document.getElementById('resumeFileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();

    document.getElementById('fileName').textContent = `Processing: ${fileName}...`;

    if (fileExt === 'pdf') {
        extractTextFromPDF(file);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
        extractTextFromDOCX(file);
    } else if (fileExt === 'txt') {
        extractTextFromTXT(file);
    } else {
        alert('Unsupported file format. Please upload PDF, DOCX, or TXT file.');
        return;
    }
}

async function extractTextFromPDF(file) {
    try {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library not loaded. Please check your internet connection.');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n';
        }

        // Check if text was successfully extracted
        if (!text || text.trim().length < 10) {
            throw new Error('This PDF appears to be an image-based or scanned document. PDFs must contain selectable text. Please try: 1) Converting the PDF to a text-searchable format, 2) Uploading a TXT file instead, or 3) Using OCR to convert the PDF.');
        }

        currentResumeText = text;
        document.getElementById('fileName').textContent = `✓ Uploaded: ${file.name}`;
        analyzeResume();
    } catch (error) {
        console.error('Error extracting PDF:', error);
        document.getElementById('fileName').textContent = '';
        alert('Error reading PDF file:\n\n' + error.message);
    }
}

async function extractTextFromDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Using a simpler approach to extract text from DOCX
        // Note: For production, consider using a more robust library
        
        // For now, we'll show the loading message
        document.getElementById('resultsContainer').style.display = 'none';
        
        // Create a simple text extraction from DOCX
        // In practice, this requires proper DOCX parsing which can be complex
        // For this implementation, we'll use a basic approach
        const text = await extractDOCXText(arrayBuffer);
        
        currentResumeText = text;
        document.getElementById('fileName').textContent = `✓ Uploaded: ${file.name}`;
        analyzeResume();
    } catch (error) {
        console.error('Error extracting DOCX:', error);
        document.getElementById('fileName').textContent = '';
        alert('Error reading DOCX file. Please try PDF or TXT format.');
    }
}

async function extractDOCXText(arrayBuffer) {
    // Simple DOCX text extraction using regex
    // This is a basic implementation; for production, use a proper library
    const view = new Uint8Array(arrayBuffer);
    
    // Convert to string
    let xmlString = '';
    for (let i = 0; i < view.length; i++) {
        xmlString += String.fromCharCode(view[i]);
    }
    
    // Extract text from XML (this is a basic approach)
    // Look for <w:t> tags which contain text in DOCX format
    const textMatches = xmlString.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const text = textMatches
        .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
        .join(' ');
    
    return text || 'Unable to extract text from DOCX. Please try a different format.';
}

function extractTextFromTXT(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        currentResumeText = e.target.result;
        document.getElementById('fileName').textContent = `✓ Uploaded: ${file.name}`;
        analyzeResume();
    };
    reader.onerror = (error) => {
        console.error('Error reading TXT:', error);
        document.getElementById('fileName').textContent = '';
        alert('Error reading text file. Please try again.');
    };
    reader.readAsText(file);
}

function handleJobDescFile(event) {
    const file = event.target.files[0];
    if (file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'pdf') {
            extractJobDescFromPDF(file);
        } else if (fileExt === 'docx' || fileExt === 'doc') {
            extractJobDescFromDOCX(file);
        } else if (fileExt === 'txt') {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentJobDescription = e.target.result;
                updateJobDescIndicator();
                document.getElementById('jobDescText').value = currentJobDescription;
            };
            reader.readAsText(file);
        }
    }
}

async function extractJobDescFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n';
        }

        currentJobDescription = text;
        updateJobDescIndicator();
        document.getElementById('jobDescText').value = currentJobDescription;
    } catch (error) {
        console.error('Error extracting PDF:', error);
        alert('Error reading job description PDF.');
    }
}

async function extractJobDescFromDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractDOCXText(arrayBuffer);
        currentJobDescription = text;
        updateJobDescIndicator();
        document.getElementById('jobDescText').value = currentJobDescription;
    } catch (error) {
        console.error('Error extracting DOCX:', error);
        alert('Error reading job description DOCX.');
    }
}

function updateJobDescIndicator() {
    const indicator = document.getElementById('jobDescIndicator');
    if (currentJobDescription && currentJobDescription.trim().length > 0) {
        indicator.style.display = 'block';
        const keywords = extractJobDescKeywords(currentJobDescription);
        document.getElementById('jobDescStatus').textContent = `Job description loaded (${keywords.length} keywords found)`;
    }
}

function clearJobDesc() {
    currentJobDescription = '';
    document.getElementById('jobDescText').value = '';
    document.getElementById('jobDescFileInput').value = '';
    document.getElementById('jobDescIndicator').style.display = 'none';
    if (currentResumeText) {
        analyzeResume();
    }
}

function analyzeWithJobDesc() {
    if (!currentResumeText || currentResumeText.trim().length === 0) {
        alert('Please upload a resume first before analyzing with job description.');
        return;
    }
    
    const jobDescText = document.getElementById('jobDescText').value;
    if (jobDescText && jobDescText.trim().length > 0) {
        currentJobDescription = jobDescText;
        updateJobDescIndicator();
        analyzeResume();
    } else {
        alert('Please enter or upload a job description.');
    }
}

function extractJobDescKeywords(jobDesc) {
    const textLower = jobDesc.toLowerCase();
    
    // Extract job-related keywords
    const jobKeywords = [
        'javascript', 'python', 'java', 'sql', 'react', 'angular', 'vue', 'node.js',
        'aws', 'azure', 'docker', 'git', 'linux', 'windows', 'api', 'rest', 'html', 'css',
        'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
        'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'firebase',
        'kubernetes', 'jenkins', 'gitlab', 'github', 'terraform', 'ansible',
        'agile', 'scrum', 'kanban', 'jira', 'confluence',
        'communication', 'leadership', 'teamwork', 'problem-solving', 'analytical',
        'years', 'experience', 'required', 'must', 'should', 'expertise'
    ];
    
    const foundKeywords = [];
    jobKeywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });
    
    return foundKeywords;
}

function analyzeResume() {
    if (!currentResumeText || currentResumeText.trim().length === 0) {
        alert('No text could be extracted from the file.\n\nPossible solutions:\n• If it\'s a PDF: Make sure it\'s not a scanned image. Try converting it to a text-searchable PDF.\n• Try uploading a .TXT file instead.\n• Check if the file is corrupted and try again.');
        return;
    }

    // Perform analysis
    analysisResults = calculateAtsScore(currentResumeText, currentJobDescription);

    // Display results
    displayResults(analysisResults);

    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
}

function calculateAtsScore(text, jobDesc = '') {
    const textLower = text.toLowerCase();
    const results = {
        overallScore: 0,
        formatScore: 0,
        keywordScore: 0,
        proScore: 0,
        sectionsScore: 0,
        foundSections: [],
        detectedKeywords: [],
        missingKeywords: [],
        strengths: [],
        improvements: [],
        recommendations: [],
        hasJobDesc: jobDesc && jobDesc.trim().length > 0,
        jobDescKeywords: [],
        matchedJobKeywords: []
    };

    // 1. Format Analysis (20 points max)
    const formatScore = analyzeFormat(text);
    results.formatScore = formatScore;

    // 2. Sections Analysis (25 points max)
    const { sectionsScore, foundSections } = analyzeSections(textLower);
    results.sectionsScore = foundSections.length;
    results.foundSections = foundSections;
    if (foundSections.length >= 4) results.formatScore += 5;

    // 3. Keywords Analysis (35 points max) - with job description support
    const { keywordScore, detectedKeywords, missingKeywords, jobDescKeywords, matchedJobKeywords } = analyzeKeywords(textLower, results.hasJobDesc ? jobDesc : '');
    results.keywordScore = keywordScore;
    results.detectedKeywords = detectedKeywords;
    results.missingKeywords = missingKeywords;
    results.jobDescKeywords = jobDescKeywords;
    results.matchedJobKeywords = matchedJobKeywords;

    // 4. Professionalism Analysis (20 points max)
    const { proScore, actionVerbs, quantifiers } = analyzeProfessionalism(text);
    results.proScore = proScore;

    // Calculate overall score
    results.overallScore = Math.round((formatScore + sectionsScore + keywordScore + proScore) / 4);

    // Generate findings
    results.strengths = buildStrengths(results, actionVerbs, quantifiers, detectedKeywords);
    results.improvements = buildImprovements(results, missingKeywords);
    results.recommendations = buildRecommendations(results, missingKeywords);

    return results;
}

function analyzeFormat(text) {
    let score = 0;

    // Check for proper length
    if (text.length > 500 && text.length < 5000) score += 5;

    // Check for line breaks and structure
    const lines = text.split('\n');
    if (lines.length > 10) score += 5;

    // Check for email
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) score += 5;

    // Check for phone number
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 5;

    return Math.min(score, 20);
}

function analyzeSections(textLower) {
    const sections = [
        { name: 'Contact Information', keywords: ['email', 'phone', 'address', 'linkedin'] },
        { name: 'Professional Summary', keywords: ['summary', 'objective', 'profile'] },
        { name: 'Work Experience', keywords: ['work experience', 'employment', 'professional experience', 'career'] },
        { name: 'Education', keywords: ['education', 'degree', 'university', 'college', 'school'] },
        { name: 'Skills', keywords: ['skills', 'technical skills', 'competencies'] },
        { name: 'Certifications', keywords: ['certification', 'certified', 'license'] },
        { name: 'Projects', keywords: ['projects', 'portfolio', 'accomplishments'] }
    ];

    const foundSections = [];
    sections.forEach(section => {
        const found = section.keywords.some(keyword => textLower.includes(keyword));
        if (found) foundSections.push(section.name);
    });

    const sectionsScore = Math.min(foundSections.length * 5, 25);
    return { sectionsScore, foundSections };
}

function analyzeKeywords(textLower, jobDesc = '') {
    // Common tech keywords for all roles
    const commonKeywords = [
        'communication', 'team', 'leadership', 'problem solving', 'managed', 'developed',
        'implemented', 'designed', 'analyzed', 'organized', 'improved', 'optimized',
        'achieved', 'resolved', 'delivered', 'developed'
    ];

    // Technology keywords
    const techKeywords = [
        'javascript', 'python', 'java', 'sql', 'react', 'angular', 'vue', 'node.js',
        'aws', 'azure', 'docker', 'git', 'linux', 'windows', 'api', 'rest', 'html', 'css',
        'typescript', 'kotlin', 'swift', 'golang', 'rust', 'php', 'ruby'
    ];

    // Important ATS keywords
    const atsKeywords = [
        'managed', 'led', 'improved', 'increased', 'decreased', 'optimized', 'analyzed',
        'implemented', 'developed', 'created', 'designed', 'oversaw', 'coordinated',
        'achieved', 'earned', 'generated', 'launched', 'organized', 'performed', 'designed',
        'directed', 'established', 'influenced', 'pioneered', 'revitalized', 'spearheaded'
    ];

    const detectedKeywords = [];
    const keywordCounts = {};

    // Check all keywords
    const allKeywords = [...new Set([...commonKeywords, ...techKeywords, ...atsKeywords])];
    allKeywords.forEach(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        const matches = textLower.match(regex);
        if (matches) {
            detectedKeywords.push({ word: keyword, count: matches.length });
            keywordCounts[keyword] = matches.length;
        }
    });

    // Find missing important keywords
    const missingKeywords = atsKeywords.filter(
        keyword => !detectedKeywords.find(k => k.word === keyword)
    );

    // Job description analysis
    let jobDescKeywords = [];
    let matchedJobKeywords = [];
    let jobKeywordScore = 0;

    if (jobDesc && jobDesc.trim().length > 0) {
        const jobDescLower = jobDesc.toLowerCase();
        
        // Extract keywords from job description
        jobDescKeywords = extractJobDescKeywords(jobDesc);
        
        // Check which job keywords are in the resume
        jobDescKeywords.forEach(jobKeyword => {
            const regex = new RegExp('\\b' + jobKeyword + '\\b', 'gi');
            if (regex.test(textLower)) {
                matchedJobKeywords.push(jobKeyword);
            }
        });
        
        // Add bonus score for matching job keywords
        if (jobDescKeywords.length > 0) {
            jobKeywordScore = Math.round((matchedJobKeywords.length / jobDescKeywords.length) * 40);
        }
    }

    // Calculate score based on keyword diversity and frequency + job match
    let keywordScore = Math.min(detectedKeywords.length * 2, 35);
    if (jobKeywordScore > 0) {
        keywordScore = Math.round((keywordScore + jobKeywordScore) / 2);
        keywordScore = Math.min(keywordScore, 100);
    }

    return { 
        keywordScore, 
        detectedKeywords: detectedKeywords.slice(0, 15), 
        missingKeywords,
        jobDescKeywords,
        matchedJobKeywords
    };
}

function analyzeProfessionalism(text) {
    let score = 0;
    const textLower = text.toLowerCase();

    const actionVerbs = [
        'achieved', 'developed', 'implemented', 'managed', 'led', 'designed',
        'optimized', 'improved', 'created', 'coordinated', 'enhanced', 'delivered',
        'streamlined', 'analyzed', 'executed', 'built', 'architected', 'established',
        'spearheaded', 'transformed', 'pioneered', 'directed', 'oversaw', 'influenced'
    ];

    const quantifiers = /(\d+%|\d+x|\$\d+|\d+\+|\d+\s*(?:hours|days|weeks|months|years))/gi;

    // Check for action verbs
    let verbCount = 0;
    actionVerbs.forEach(verb => {
        if (textLower.includes(verb)) verbCount++;
    });

    if (verbCount > 5) score += 10;
    else if (verbCount > 2) score += 5;

    // Check for quantification
    const quantMatches = text.match(quantifiers);
    if (quantMatches && quantMatches.length > 3) score += 10;
    else if (quantMatches && quantMatches.length > 0) score += 5;

    return { proScore: Math.min(score, 20), actionVerbs: verbCount, quantifiers: quantMatches ? quantMatches.length : 0 };
}

function buildStrengths(results, actionVerbs, quantifiers, detectedKeywords) {
    const strengths = [];

    if (results.formatScore >= 15) {
        strengths.push({
            title: 'Good Resume Format',
            text: 'Your resume has a well-structured format with proper contact information.',
            type: 'positive'
        });
    }

    if (results.foundSections.length >= 5) {
        strengths.push({
            title: 'Complete Sections',
            text: `Your resume includes ${results.foundSections.length} important sections.`,
            type: 'positive'
        });
    }

    if (actionVerbs >= 5) {
        strengths.push({
            title: 'Strong Action Verbs',
            text: 'You\'ve used multiple strong action verbs to describe your achievements.',
            type: 'positive'
        });
    }

    if (quantifiers >= 3) {
        strengths.push({
            title: 'Quantified Results',
            text: 'Your resume includes specific numbers and metrics to highlight achievements.',
            type: 'positive'
        });
    }

    if (results.detectedKeywords.length > 10) {
        strengths.push({
            title: 'Good Keyword Diversity',
            text: `You've used ${results.detectedKeywords.length} relevant industry keywords.`,
            type: 'positive'
        });
    }

    // Job description matching
    if (results.hasJobDesc && results.matchedJobKeywords && results.matchedJobKeywords.length > 0) {
        const matchPercentage = Math.round((results.matchedJobKeywords.length / results.jobDescKeywords.length) * 100);
        if (matchPercentage >= 70) {
            strengths.push({
                title: 'Excellent Job Match',
                text: `Your resume matches ${matchPercentage}% of the job description keywords.`,
                type: 'positive'
            });
        } else if (matchPercentage >= 50) {
            strengths.push({
                title: 'Good Job Match',
                text: `Your resume matches ${matchPercentage}% of the job description keywords.`,
                type: 'positive'
            });
        }
    }

    if (strengths.length === 0) {
        strengths.push({
            title: 'Resume Exists',
            text: 'Great! You have a resume to work with. Let\'s improve it.',
            type: 'neutral'
        });
    }

    return strengths;
}

function buildImprovements(results, missingKeywords) {
    const improvements = [];

    if (results.formatScore < 15) {
        improvements.push({
            title: 'Improve Resume Format',
            text: 'Make sure your contact information is clear and easily accessible.',
            type: 'caution'
        });
    }

    if (results.foundSections.length < 4) {
        improvements.push({
            title: 'Missing Sections',
            text: 'Consider adding more sections like Professional Summary, Skills, or Certifications.',
            type: 'caution'
        });
    }

    if (results.keywordScore < 20) {
        improvements.push({
            title: 'Add More Keywords',
            text: 'Include industry-specific keywords and skills related to your target position.',
            type: 'caution'
        });
    }

    if (results.proScore < 15) {
        improvements.push({
            title: 'Use Action Verbs',
            text: 'Start bullet points with strong action verbs like "Managed", "Developed", "Led".',
            type: 'caution'
        });
    }

    // Job description specific improvements
    if (results.hasJobDesc && results.matchedJobKeywords && results.matchedJobKeywords.length < results.jobDescKeywords.length * 0.5) {
        const missingPercent = Math.round((1 - (results.matchedJobKeywords.length / results.jobDescKeywords.length)) * 100);
        improvements.push({
            title: 'Missing Job-Specific Keywords',
            text: `Your resume is missing ${missingPercent}% of the key job requirements. Consider adding these missing keywords.`,
            type: 'caution'
        });
    }

    if (results.overallScore < 70) {
        improvements.push({
            title: 'Overall Optimization Needed',
            text: 'Your resume score is below the ATS-friendly threshold. Focus on the recommendations below.',
            type: 'caution'
        });
    }

    return improvements;
}

function buildRecommendations(results, missingKeywords) {
    const recommendations = [];

    if (results.hasJobDesc) {
        recommendations.push('Add missing keywords from the job description to improve role-specific match');
        if (results.matchedJobKeywords && results.matchedJobKeywords.length < results.jobDescKeywords.length) {
            const missingJobKeywords = results.jobDescKeywords.filter(kw => !results.matchedJobKeywords.includes(kw));
            if (missingJobKeywords.length > 0) {
                recommendations.push(`Focus on these role-specific keywords: ${missingJobKeywords.slice(0, 5).join(', ')}`);
            }
        }
    } else {
        recommendations.push('Add or emphasize relevant keywords from the job description you\'re applying for');
    }

    if (results.proScore < 15) {
        recommendations.push('Replace passive language with strong action verbs at the beginning of each bullet point');
    }

    if (results.foundSections.length < 5) {
        recommendations.push('Add missing sections to make your resume more comprehensive');
    }

    recommendations.push('Include specific metrics and numbers to quantify your achievements');
    recommendations.push('Use standard section headings (Experience, Education, Skills, etc.) for better ATS parsing');
    recommendations.push('Avoid graphics, images, and complex formatting that ATS systems might not read');
    recommendations.push('Use standard fonts and avoid special characters or formatting');

    if (missingKeywords.length > 0) {
        recommendations.push(`Consider adding these important keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    }

    return recommendations;
}

function displayResults(results) {
    // Update overall score
    const scoreEl = document.getElementById('overallScore');
    scoreEl.textContent = results.overallScore;
    scoreEl.classList.remove('excellent', 'good', 'needs-work');

    if (results.overallScore >= 85) {
        scoreEl.classList.add('excellent');
        document.getElementById('scoreStatus').textContent = 'Excellent! ATS-friendly resume';
    } else if (results.overallScore >= 70) {
        scoreEl.classList.add('good');
        document.getElementById('scoreStatus').textContent = 'Good! Ready to apply';
    } else {
        scoreEl.classList.add('needs-work');
        document.getElementById('scoreStatus').textContent = 'Needs improvement';
    }

    // Update metrics
    updateMetricDisplay('formatScore', results.formatScore);
    updateMetricDisplay('keywordScore', results.keywordScore);
    updateMetricDisplay('proScore', results.proScore);

    const sectionsEl = document.getElementById('sectionsScore');
    sectionsEl.textContent = results.foundSections.length;

    // Update tabs content
    displayStrengths(results.strengths);
    displayImprovements(results.improvements);
    displayKeywords(results);
    displaySections(results.foundSections);

    // Display recommendations
    displayRecommendations(results.recommendations);
}

function updateMetricDisplay(elementId, score) {
    const el = document.getElementById(elementId);
    el.textContent = score + '%';
    el.classList.remove('excellent', 'good', 'needs-work');

    if (score >= 85) {
        el.classList.add('excellent');
    } else if (score >= 70) {
        el.classList.add('good');
    } else if (score > 0) {
        el.classList.add('needs-work');
    }
}

function displayStrengths(strengths) {
    const container = document.getElementById('strengths');
    container.innerHTML = '';

    if (strengths.length === 0) {
        container.innerHTML = '<div class="empty-state">No strengths identified yet.</div>';
        return;
    }

    strengths.forEach(strength => {
        const item = document.createElement('div');
        item.className = `finding-item ${strength.type}`;
        item.innerHTML = `
            <div class="finding-title">
                <span class="finding-icon">
                    <i class="fas fa-${strength.type === 'positive' ? 'check-circle' : 'info-circle'}"></i>
                </span>
                ${strength.title}
            </div>
            <div class="finding-text">${strength.text}</div>
        `;
        container.appendChild(item);
    });
}

function displayImprovements(improvements) {
    const container = document.getElementById('improvements');
    container.innerHTML = '';

    if (improvements.length === 0) {
        container.innerHTML = '<div class="empty-state">Your resume looks great! No major improvements needed.</div>';
        return;
    }

    improvements.forEach(improvement => {
        const item = document.createElement('div');
        item.className = `finding-item ${improvement.type}`;
        item.innerHTML = `
            <div class="finding-title">
                <span class="finding-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </span>
                ${improvement.title}
            </div>
            <div class="finding-text">${improvement.text}</div>
        `;
        container.appendChild(item);
    });
}

function displayKeywords(results) {
    const container = document.getElementById('keywords');
    container.innerHTML = '';

    let html = '';
    
    // Job description keywords section (if available)
    if (results.hasJobDesc && results.jobDescKeywords && results.jobDescKeywords.length > 0) {
        html += '<h4 style="color: #22c55e;">Job Description Keywords Match</h4>';
        html += '<div style="margin-bottom: 1rem;">';
        
        // Matched keywords
        if (results.matchedJobKeywords && results.matchedJobKeywords.length > 0) {
            html += '<p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Found in Resume ✓</strong></p>';
            html += '<div class="keyword-tags" style="margin-bottom: 1rem;">';
            results.matchedJobKeywords.slice(0, 12).forEach(kw => {
                html += `<span class="keyword-tag" style="background: #22c55e;">${kw}</span>`;
            });
            html += '</div>';
        }
        
        // Missing keywords
        const missingJobKeywords = results.jobDescKeywords.filter(kw => !results.matchedJobKeywords || !results.matchedJobKeywords.includes(kw));
        if (missingJobKeywords.length > 0) {
            html += '<p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Missing from Resume ✗</strong></p>';
            html += '<div class="keyword-tags" style="margin-bottom: 1rem;">';
            missingJobKeywords.slice(0, 12).forEach(kw => {
                html += `<span class="keyword-tag" style="background: var(--color-warning); opacity: 0.8;">${kw}</span>`;
            });
            html += '</div>';
        }
        
        html += '</div><hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--color-border);">';
    }

    html += '<h4>General Keywords in Resume</h4>';
    if (results.detectedKeywords.length > 0) {
        html += '<div class="keyword-tags">';
        results.detectedKeywords.forEach(kw => {
            html += `<span class="keyword-tag">${kw.word} <small>(${kw.count})</small></span>`;
        });
        html += '</div>';
    } else {
        html += '<p style="color: var(--color-text-secondary);">No primary keywords detected. Consider adding more.</p>';
    }

    if (results.missingKeywords.length > 0) {
        html += '<h4 style="margin-top: 1rem;">Suggested General Keywords to Add</h4>';
        html += '<div class="keyword-tags">';
        results.missingKeywords.slice(0, 10).forEach(kw => {
            html += `<span class="keyword-tag" style="background: var(--color-info); opacity: 0.8;">${kw}</span>`;
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

function displaySections(foundSections) {
    const container = document.getElementById('sections');
    container.innerHTML = '';

    const allSections = [
        'Contact Information',
        'Professional Summary',
        'Work Experience',
        'Education',
        'Skills',
        'Certifications',
        'Projects'
    ];

    let html = '';
    allSections.forEach(section => {
        const found = foundSections.includes(section);
        html += `
            <div class="finding-item ${found ? 'positive' : 'caution'}">
                <div class="finding-title">
                    <span class="finding-icon">
                        <i class="fas fa-${found ? 'check' : 'times'}-circle"></i>
                    </span>
                    ${section}
                </div>
                <div class="finding-text">${found ? 'Found ✓' : 'Missing - Consider adding this section'}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsDiv');
    const list = document.getElementById('recommendationsList');

    list.innerHTML = '';
    recommendations.forEach((rec, idx) => {
        const li = document.createElement('li');
        li.textContent = rec;
        list.appendChild(li);
    });

    container.style.display = recommendations.length > 0 ? 'block' : 'none';
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

function goBack() {
    window.location.href = 'index.html';
}
