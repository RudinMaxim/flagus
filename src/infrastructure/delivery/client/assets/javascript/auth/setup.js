document.addEventListener('DOMContentLoaded', function () {
  checkFirstUserSetup();

  setupFirstAdminForm();

  setupPasswordToggle();

  setupPasswordGenerator();
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkFirstUserSetup() {
  fetch('/api/v1/auth/check-first-user', {
    headers: {
      // TODO
      'X-API-Key': 'flugs',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error checking first user');
      }
      return response.json();
    })
    .then(data => {
      if (!data?.data.isFirstUser) {
        window.location.href = '/login';
      }
    })
    .catch(error => {
      console.error('Error checking first user:', error);
      showError('Failed to check system status. Please refresh the page.');
    });
}

function setupFirstAdminForm() {
  const form = document.getElementById('firstAdminForm');
  const errorContainer = document.getElementById('setupError');
  const submitButton = document.getElementById('submitButton');
  const setupSpinner = document.getElementById('setupSpinner');
  const setupButtonText = document.getElementById('setupButtonText');

  const passwordInput = document.getElementById('password');
  const passwordStrengthMeter = document.getElementById('passwordStrength');
  const passwordFeedback = document.getElementById('passwordFeedback');

  if (passwordInput) {
    const debouncedValidatePassword = debounce(function (value) {
      validatePassword(value);
    }, 300);

    passwordInput.addEventListener('input', function () {
      debouncedValidatePassword(this.value);
    });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!navigator.onLine) {
      showError(
        'There is no internet connection. Please check your connection and try again.'
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    toggleLoadingState(true);

    hideError();

    const formData = {
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    };

    try {
      const response = await fetch('/api/v1/auth/create-first-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Administrator account successfully created!');

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showError(result.message || 'Error creating account');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      showError('There was an error sending your request. Please try again later..');
    } finally {
      toggleLoadingState(false);
    }
  });

  function validateForm() {
    const username = form.username.value.trim();
    if (username.length < 3) {
      showError('Username must be at least 3 characters long');
      return false;
    }

    const email = form.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return false;
    }

    const password = form.password.value;
    if (password.length < 8) {
      showError('Password must be at least 8 characters long');
      return false;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasLetter && hasNumber && hasSpecial)) {
      showError('The password must contain letters, numbers and special characters.');
      return false;
    }

    return true;
  }

  function validatePassword(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-zA-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Add letters');
    }

    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Add numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Add special characters');
    }

    updatePasswordStrengthUI(strength, feedback);
  }

  function updatePasswordStrengthUI(strength, feedback) {
    passwordStrengthMeter.className = 'progress-bar';

    passwordStrengthMeter.style.width = strength * 25 + '%';

    if (strength === 0) {
      passwordStrengthMeter.classList.add('bg-danger');
      passwordStrengthMeter.textContent = 'Very weak';
    } else if (strength === 1) {
      passwordStrengthMeter.classList.add('bg-danger');
      passwordStrengthMeter.textContent = 'Weak';
    } else if (strength === 2) {
      passwordStrengthMeter.classList.add('bg-warning');
      passwordStrengthMeter.textContent = 'Average';
    } else if (strength === 3) {
      passwordStrengthMeter.classList.add('bg-info');
      passwordStrengthMeter.textContent = 'Good';
    } else {
      passwordStrengthMeter.classList.add('bg-success');
      passwordStrengthMeter.textContent = 'Strength';
    }

    passwordFeedback.innerHTML =
      feedback.length > 0 ? feedback.map(item => `<div>${item}</div>`).join('') : '';
  }

  function showError(message) {
    errorContainer.innerHTML = escapeHTML(message);
    errorContainer.classList.remove('d-none');
    errorContainer.classList.remove('alert-success');
    errorContainer.classList.add('alert-danger');
    errorContainer.setAttribute('aria-live', 'assertive');

    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showSuccess(message) {
    errorContainer.innerHTML = escapeHTML(message);
    errorContainer.classList.remove('d-none');
    errorContainer.classList.remove('alert-danger');
    errorContainer.classList.add('alert-success');
    errorContainer.setAttribute('aria-live', 'assertive');
  }

  function hideError() {
    errorContainer.textContent = '';
    errorContainer.classList.add('d-none');
  }

  function toggleLoadingState(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      setupSpinner.classList.remove('d-none');
      setupButtonText.textContent = 'Создание...';
    } else {
      submitButton.disabled = false;
      setupSpinner.classList.add('d-none');
      setupButtonText.textContent = 'Create an administrator account';
    }
  }
}

function setupPasswordToggle() {
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const toggleIcon = toggleButton.querySelector('i');

  toggleButton.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    if (type === 'text') {
      toggleIcon.classList.remove('bi-eye');
      toggleIcon.classList.add('bi-eye-slash');
    } else {
      toggleIcon.classList.remove('bi-eye-slash');
      toggleIcon.classList.add('bi-eye');
    }
  });
}

function generateSecurePassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_-+=<>?';

  const allChars = lowercase + uppercase + numbers + special;
  const length = 16;

  let password = '';

  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }

  password = password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');

  return password;
}

const setupPasswordGenerator = function () {
  const generatePasswordButton = document.getElementById('generatePassword');
  const passwordInput = document.getElementById('password');

  if (generatePasswordButton && passwordInput) {
    generatePasswordButton.addEventListener('click', function (e) {
      e.preventDefault();

      const securePassword = generateSecurePassword();

      passwordInput.value = securePassword;

      const inputEvent = new Event('input', { bubbles: true });
      passwordInput.dispatchEvent(inputEvent);

      navigator.clipboard
        .writeText(securePassword)
        .then(() => {
          const passwordHelp = document.getElementById('passwordHelp');
          const originalText = passwordHelp.textContent;

          passwordHelp.textContent = 'Password copied to clipboard!';
          passwordHelp.classList.add('text-success');

          setTimeout(() => {
            passwordHelp.textContent = originalText;
            passwordHelp.classList.remove('text-success');
          }, 3000);
        })
        .catch(err => {
          console.error('Failed to copy password: ', err);
        });
    });
  }
};
