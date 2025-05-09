document.addEventListener('DOMContentLoaded', function () {
  checkFirstUser();
  setupLoginForm();
  setupPasswordToggle();
});

window.addEventListener('beforeunload', cleanupEventListeners);

function cleanupEventListeners() {
  const form = document.getElementById('loginForm');
  const toggleButton = document.getElementById('togglePassword');

  if (form) {
    const newForm = form.cloneNode(true);
    if (form.parentNode) {
      form.parentNode.replaceChild(newForm, form);
    }
  }

  if (toggleButton) {
    const newToggleButton = toggleButton.cloneNode(true);
    if (toggleButton.parentNode) {
      toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
    }
  }
}

function fetchWithTimeout(url, options, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    ),
  ]);
}

function checkFirstUser() {
  fetchWithTimeout('/api/v1/auth/check-first-user', {
    headers: {
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
      if (data?.data?.isFirstUser) {
        window.location.href = '/setup';
      }
    })
    .catch(error => {
      console.error('Error checking first user:', error);
      if (error.message === 'Failed to fetch' || error.message.includes('waiting time')) {
        const errorContainer = document.getElementById('loginError');
        if (errorContainer) {
          errorContainer.textContent =
            'Failed to connect to server. Check your internet connection.';
          errorContainer.classList.remove('d-none');
          errorContainer.setAttribute('aria-live', 'assertive');
        }
      }
    });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const errorContainer = document.getElementById('loginError');
  const submitButton = document.getElementById('submitButton');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginButtonText = document.getElementById('loginButtonText');

  if (!form) {
    console.error('Login form element not found');
    return;
  }

  if (!errorContainer) {
    console.error('Error container not found');
    return;
  }

  if (!submitButton || !loginSpinner || !loginButtonText) {
    console.error('Submit button elements not found');
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    toggleLoadingState(true);

    hideError();

    const formData = {
      email: form.email.value.trim(),
      password: form.password.value,
      rememberMe: form.rememberMe?.checked || false,
    };

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        handleSuccessfulLogin(result.data);
      } else {
        showError(result.message || 'Incorrect email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('There was an error signing in. Please try again later.');
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
    if (isLoading) {
      submitButton.disabled = true;
      loginSpinner.classList.remove('d-none');
      loginButtonText.textContent = 'Sign in...';
    } else {
      submitButton.disabled = false;
      loginSpinner.classList.add('d-none');
      loginButtonText.textContent = 'Sign In';
    }
  }

  function handleSuccessfulLogin(data) {
    const { accessToken, refreshToken } = data;

    if (accessToken && refreshToken) {
      try {
        const secure = window.location.protocol === 'https:' ? 'secure;' : '';
        const httpOnly = window.location.hostname === 'localhost' ? '' : 'HttpOnly;';

        document.cookie = `accessToken=${accessToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=3600`;
        document.cookie = `refreshToken=${refreshToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=604800`;

        if (checkCookies(accessToken, refreshToken)) {
          localStorage.setItem('isAuthenticated', 'true');
          window.location.href = '/';
        } else {
          showError('Failed to save login details. Check your browser settings.');
        }
      } catch (error) {
        console.error('Error installing cookies:', error);
        showError('An error occurred while saving your authorization data.');
      }
    } else {
      showError('The server did not return the required authorization data.');
    }
  }

  function checkCookies(accessToken, refreshToken) {
    const cookies = document.cookie;
    return (
      cookies.includes(`accessToken=${accessToken}`) &&
      cookies.includes(`refreshToken=${refreshToken}`)
    );
  }
}

function setupPasswordToggle() {
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  if (!toggleButton || !passwordInput) {
    console.error('Password Switch Elements Not Found');
    return;
  }

  const toggleIcon = toggleButton.querySelector('i');
  if (!toggleIcon) {
    console.error('Password switch icon not found');
    return;
  }

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
