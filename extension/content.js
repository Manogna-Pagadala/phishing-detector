let lastEmailId = null;

// Wait for Gmail to fully load and keep watching
function waitForEmail() {
  const observer = new MutationObserver(() => {
    const emailBody = document.querySelector('.a3s.aiL');
    const senderEl = document.querySelector('.gD');
    const subjectEl = document.querySelector('.hP');

    if (emailBody && senderEl) {
      // Create unique ID for this email to avoid re-analyzing same one
      const emailId = senderEl.getAttribute('email') + emailBody.innerText.slice(0, 50);
      
      if (emailId !== lastEmailId) {
        lastEmailId = emailId;
        analyzeEmail(senderEl, subjectEl, emailBody);
      }
    } else {
      // No email open — remove banner
      const existing = document.getElementById('phishing-banner');
      if (existing) existing.remove();
      lastEmailId = null;
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Extract links from email body
function extractLinks(emailBody) {
  const anchors = emailBody.querySelectorAll('a');
  return Array.from(anchors).map(a => a.href).filter(Boolean);
}

// Send email data to your backend
async function analyzeEmail(senderEl, subjectEl, emailBody) {
  const sender = senderEl.getAttribute('email') || senderEl.innerText;
  const subject = subjectEl ? subjectEl.innerText : '';
  const body = emailBody.innerText;
  const links = extractLinks(emailBody);

  // Show loading banner
  showBanner('Analyzing email for phishing...', '#FFA500', '⏳');

  try {
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, subject, body, links })
    });

    const result = await response.json();
    displayResult(result);

  } catch (error) {
    showBanner('Could not connect to phishing detector backend.', '#888888', '⚠️');
  }
}

// Display the result banner inside Gmail
function displayResult(result) {
  if (result.verdict === 'PHISHING') {
    showBanner(
      `🚨 PHISHING DETECTED (Risk: ${result.risk_score}/100)\n${result.summary}\n\nReasons: ${result.reasons.join(' | ')}`,
      '#FF0000',
      '🚨'
    );
  } else if (result.verdict === 'CAUTION') {
    showBanner(
      `⚠️ BE CAUTIOUS (Risk: ${result.risk_score}/100)\n${result.summary}`,
      '#FFA500',
      '⚠️'
    );
  } else {
    showBanner(
      `✅ Email looks safe (Risk: ${result.risk_score}/100)`,
      '#008000',
      '✅'
    );
  }
}

// Create and show a banner at the top of the email
function showBanner(message, color, icon) {
  const existing = document.getElementById('phishing-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'phishing-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: ${color};
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 20px;
    z-index: 99999;
    white-space: pre-wrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  banner.innerText = message;

  document.body.prepend(banner);
}

// Start watching Gmail
waitForEmail();