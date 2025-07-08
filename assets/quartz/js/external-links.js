function addTargetToExternalLinks() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTargetToExternalLinks);
} else {
  addTargetToExternalLinks();
}