// Replaces Webflow's hosted form handling (webflow.com/api/v1/form/...) with
// our own /api/form endpoint (see api/form.js). Runs in the capture phase so it
// wins over webflow.js's own submit handler, and reuses Webflow's success/error
// blocks (.w-form-done / .w-form-fail) for the UI.
(function () {
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      // Only handle Webflow data forms; leave anything with an explicit action
      // (e.g. the 401 password page) alone.
      if (!form.hasAttribute('data-name') || form.hasAttribute('action')) return;
      e.preventDefault();
      e.stopPropagation();

      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = v;
      });
      var payload = {
        form: form.getAttribute('data-name'),
        page: location.pathname,
        data: data,
      };

      var wrapper = form.closest('.w-form');
      var done = wrapper && wrapper.querySelector('.w-form-done');
      var fail = wrapper && wrapper.querySelector('.w-form-fail');
      var btn = form.querySelector('input[type="submit"], button[type="submit"]');
      var idle = btn && (btn.value || btn.textContent);
      var wait = btn && btn.getAttribute('data-wait');
      if (btn && wait) btn.value ? (btn.value = wait) : (btn.textContent = wait);
      if (btn) btn.disabled = true;

      fetch('/api/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (!r.ok) throw new Error('submit failed');
          form.style.display = 'none';
          if (done) done.style.display = 'block';
          if (fail) fail.style.display = 'none';
        })
        .catch(function () {
          if (fail) fail.style.display = 'block';
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            if (wait) btn.value ? (btn.value = idle) : (btn.textContent = idle);
          }
        });
    },
    true
  );
})();
