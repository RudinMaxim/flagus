// Shared login strategy - reusable across login and setup
async function loginAndSaveTokens(email, password, rememberMe = false) {
  const formData = { email, password, rememberMe };
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Incorrect email or password');
    }

    const { accessToken, refreshToken } = result.data;
    if (!accessToken || !refreshToken) {
      throw new Error('Server did not return required authorization data');
    }

    const secure = window.location.protocol === 'https:' ? 'secure;' : '';
    const httpOnly = window.location.hostname === 'localhost' ? '' : 'HttpOnly;';

    document.cookie = `accessToken=${accessToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=3600`;
    document.cookie = `refreshToken=${refreshToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=604800`;

    if (!checkCookies(accessToken, refreshToken)) {
      throw new Error('Failed to save login details. Check browser settings.');
    }

    localStorage.setItem('isAuthenticated', 'true');
    window.location.href = '/';
}

// Utility to verify cookie persistence
function checkCookies(accessToken, refreshToken) {
  const cookies = document.cookie;
  return (
    cookies.includes(`accessToken=${accessToken}`) &&
    cookies.includes(`refreshToken=${refreshToken}`)
  );
}

document.addEventListener('DOMContentLoaded', () => {
  checkFirstUser();
  setupLoginForm();
  setupPasswordToggle();
});

window.addEventListener('beforeunload', cleanupEventListeners);

function cleanupEventListeners() {
  const form = document.getElementById('loginForm');
  const toggleButton = document.getElementById('togglePassword');
  if (form && form.parentNode) {
    form.parentNode.replaceChild(form.cloneNode(true), form);
  }
  if (toggleButton && toggleButton.parentNode) {
    toggleButton.parentNode.replaceChild(toggleButton.cloneNode(true), toggleButton);
  }
}

function fetchWithTimeout(url, options, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout)),
  ]);
}

function checkFirstUser() {
  fetchWithTimeout('/api/v1/auth/check-first-user', { headers: { 'X-API-Key': 'flugs' } })
    .then(response => {
      if (!response.ok) throw new Error('Error checking first user');
      return response.json();
    })
    .then(data => {
      if (data?.data?.isFirstUser) window.location.href = '/setup';
    })
    .catch(error => {
      console.error('Check first user failed:', error);
      const errorContainer = document.getElementById('loginError');
      if (errorContainer) {
        errorContainer.textContent = 'Failed to connect to server. Check your internet connection.';
        errorContainer.classList.remove('d-none');
        errorContainer.setAttribute('aria-live', 'assertive');
      }
    });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const errorContainer = document.getElementById('loginError');
  const submitButton = document.getElementById('submitButton');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginButtonText = document.getElementById('loginButtonText');

  if (!form || !errorContainer || !submitButton || !loginSpinner || !loginButtonText) {
    console.error('Login form elements missing');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    toggleLoadingState(true);
    hideError();

    const email = form.email.value.trim();
    const password = form.password.value;
    const rememberMe = form.rememberMe?.checked || false;

    try {
      await loginAndSaveTokens(email, password, rememberMe);
    } catch (error) {
      showError(error.message);
    } finally {
      toggleLoadingState(false);
    }
  });

  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('d-none');
    errorContainer.setAttribute('aria-live', 'assertive');
  }

  function hideError() {
    errorContainer.textContent = '';
    errorContainer.classList.add('d-none');
  }

  function toggleLoadingState(isLoading) {
    submitButton.disabled = isLoading;
    loginSpinner.classList.toggle('d-none', !isLoading);
    loginButtonText.textContent = isLoading ? 'Sign in...' : 'Sign In';
  }
}

function setupPasswordToggle() {
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const toggleIcon = toggleButton?.querySelector('i');

  if (!toggleButton || !passwordInput || !toggleIcon) {
    console.error('Password toggle elements missing');
    return;
  }

  toggleButton.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    toggleIcon.classList.toggle('bi-eye', !isPassword);
    toggleIcon.classList.toggle('bi-eye-slash', isPassword);
  });
}
