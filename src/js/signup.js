(() => {
  if (window.__wmlSignup) return;
  window.__wmlSignup = true;
  const forms = document.querySelectorAll('form.signup[data-kit]');
  if (!forms.length) return;
  const frame = document.createElement('iframe');
  frame.name = 'wml-kit';
  frame.hidden = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  document.body.appendChild(frame);
  forms.forEach((form) => {
    form.target = frame.name;
    form.addEventListener('submit', () => {
      const fields = form.querySelector('.signup-fields');
      const done = form.querySelector('.signup-confirm');
      if (fields) fields.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus();
      }
    });
  });
})();
