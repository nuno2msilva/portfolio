'use strict';

function initContactForm() {
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-button');
  if (!form) return;

  emailjs.init('1I46WcUrJKRv9YRh_');

  const fields = [
    {
      input: document.getElementById('field-name'),
      bag: shuffleBag([
        "Can I at least get your name?",
        "Don't be shy, what's your name?",
        "A name would be nice!",
        "Who goes there?",
      ]),
    },
    {
      input: document.getElementById('field-email'),
      bag: shuffleBag([
        "Would love to get back to you!",
        "How do I reach you?",
        "Leave me a way to reply!",
        "An email would help a lot!",
      ]),
    },
    {
      input: document.getElementById('field-message'),
      bag: shuffleBag([
        "How may I help?",
        "Tell me all about your ideas!",
        "Share your secrets with me!",
        "What's on your mind?",
        "Say something, anything!",
      ]),
    },
  ];

  // Shakes the field, swaps the placeholder to a fun message for 2s,
  // then restores. The red border stays until the user types.
  function flashFieldError(field) {
    const input = field.input;
    if (!input || input._flashing) return;

    const originalPlaceholder = input.placeholder;
    const savedValue          = input.value;

    input._flashing   = true;
    input.value       = '';
    input.placeholder = field.bag.next();
    input.classList.add('form-input-flash');

    setTimeout(() => {
      input.value       = savedValue;
      input.placeholder = originalPlaceholder;
      input.classList.remove('form-input-flash');
      input.classList.add('form-input-error');
      input._flashing   = false;
    }, 2000);
  }

  fields.forEach(({ input }) => {
    input?.addEventListener('input', () => {
      input.classList.remove('form-input-flash', 'form-input-error');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const [name, email, message] = fields;

    const nameValid    = name.input?.value.trim().length > 0;
    const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.input?.value.trim() ?? '');
    const messageValid = message.input?.value.trim().length > 0;

    let hasErrors = false;
    if (!nameValid)    { flashFieldError(name);    hasErrors = true; }
    if (!emailValid)   { flashFieldError(email);   hasErrors = true; }
    if (!messageValid) { flashFieldError(message); hasErrors = true; }
    if (hasErrors) return;

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    submitBtn.disabled  = true;

    emailjs.sendForm('service_a8frj6a', 'template_2ptfw3a', form)
      .then(() => {
        const formElements = form.querySelectorAll('.form-group, button[type="submit"]');
        formElements.forEach(el => { el.style.display = 'none'; });

        const successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Message sent! I\'ll get back to you soon.';
        form.appendChild(successMsg);

        setTimeout(() => {
          successMsg.remove();
          formElements.forEach(el => { el.style.display = ''; });
          form.reset();
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
          submitBtn.disabled  = false;
        }, 5000);
      })
      .catch(() => {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        submitBtn.disabled  = false;

        const errorMsg = document.createElement('p');
        errorMsg.className   = 'form-send-error';
        errorMsg.textContent = 'Something went wrong — please try again.';
        form.appendChild(errorMsg);

        setTimeout(() => errorMsg.remove(), 4000);
      });
  });
}
