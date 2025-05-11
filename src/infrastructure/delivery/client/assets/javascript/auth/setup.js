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
    throw new Error(result.message || 'Login failed');
  }

  const { accessToken, refreshToken } = result.data;
  if (!accessToken || !refreshToken) {
    throw new Error('Server did not return required authorization data');
  }

  const secure = window.location.protocol === 'https:' ? 'secure;' : '';
  const httpOnly = window.location.hostname === 'localhost' ? '' : 'HttpOnly;';
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  document.cookie = `accessToken=${accessToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=3600`;
  document.cookie = `refreshToken=${refreshToken}; path=/; ${secure} ${httpOnly} SameSite=Lax; max-age=604800`;

  if (!checkCookies(accessToken, refreshToken)) {
    throw new Error('Failed to save login details. Check browser settings.');
  }

  localStorage.setItem('isAuthenticated', 'true');
  window.location.href = '/';
}

function checkCookies(accessToken, refreshToken) {
  const cookies = document.cookie;
  return (
    cookies.includes(`accessToken=${accessToken}`) &&
    cookies.includes(`refreshToken=${refreshToken}`)
  );
}

class SetupApp {
  constructor() {
    this.API_KEY = 'flugs'; // TODO: Secure this in production
    this.currentStep = 1;
    this.adminData = null;
    this.elements = {
      step1Indicator: document.getElementById('step1Indicator'),
      step2Indicator: document.getElementById('step2Indicator'),
      step3Indicator: document.getElementById('step3Indicator'),
      progressBar: document.getElementById('setupProgressBar'),
      step1Form: document.getElementById('step1Form'),
      step2Form: document.getElementById('step2Form'),
      step3Complete: document.getElementById('step3Complete'),
      adminForm: document.getElementById('adminForm'),
      environmentForm: document.getElementById('environmentForm'),
      errorContainer: document.getElementById('setupError'),
      passwordInput: document.getElementById('password'),
      passwordStrengthMeter: document.getElementById('passwordStrength'),
      passwordFeedback: document.getElementById('passwordFeedback'),
      submitAdminButton: document.getElementById('submitAdminButton'),
      adminSpinner: document.getElementById('adminSpinner'),
      adminButtonText: document.getElementById('adminButtonText'),
      customEnvironmentsContainer: document.getElementById('customEnvironments'),
      addCustomEnvButton: document.getElementById('addCustomEnvButton'),
      backToAdminButton: document.getElementById('backToAdminButton'),
      submitEnvironmentButton: document.getElementById('submitEnvironmentButton'),
      envSpinner: document.getElementById('envSpinner'),
      envButtonText: document.getElementById('envButtonText'),
      customEnvTemplate: document.getElementById('customEnvTemplate'),
      generatePasswordButton: document.getElementById('generatePassword'),
      togglePasswordButton: document.getElementById('togglePassword'),
    };
    this.init();
  }

  init() {
    this.checkFirstUserSetup();
    this.initEventListeners();
  }

  initEventListeners() {
    this.elements.adminForm.addEventListener('submit', this.handleAdminFormSubmit.bind(this));
    this.elements.environmentForm.addEventListener(
      'submit',
      this.handleEnvironmentFormSubmit.bind(this)
    );
    this.elements.backToAdminButton.addEventListener('click', () => this.navigateToStep(1));

    const debouncedValidatePassword = this.debounce(value => this.validatePassword(value), 300);
    this.elements.passwordInput?.addEventListener('input', () =>
      debouncedValidatePassword(this.elements.passwordInput.value)
    );

    this.setupPasswordToggle();
    this.setupPasswordGenerator();
    this.elements.addCustomEnvButton.addEventListener(
      'click',
      this.addCustomEnvironment.bind(this)
    );
    this.elements.customEnvironmentsContainer.addEventListener('click', event => {
      const removeBtn = event.target.closest('.remove-custom-env');
      if (removeBtn) removeBtn.closest('.custom-environment')?.remove();
    });
  }

  async checkFirstUserSetup() {
    try {
      const response = await fetch('/api/v1/auth/check-first-user', {
        headers: { 'X-API-Key': this.API_KEY },
      });
      if (!response.ok) throw new Error('Error checking first user');
      const data = await response.json();
      if (!data?.data.isFirstUser) window.location.href = '/login';
    } catch (error) {
      console.error('Check first user failed:', error);
      this.showError('Failed to check system status. Please refresh the page.');
    }
  }

  async handleAdminFormSubmit(event) {
    event.preventDefault();
    if (!navigator.onLine) {
      this.showError('No internet connection. Please check and try again.');
      return;
    }
    if (!this.validateAdminForm()) return;

    this.toggleAdminLoadingState(true);
    this.hideError();

    const formData = {
      username: this.elements.adminForm.username.value.trim(),
      email: this.elements.adminForm.email.value.trim(),
      password: this.elements.adminForm.password.value,
    };

    try {
      const response = await fetch('/api/v1/auth/create-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Error creating admin');
      }
      this.adminData = formData;
      this.navigateToStep(2);
    } catch (error) {
      this.showError(error.message || 'Error sending request. Try again later.');
    } finally {
      this.toggleAdminLoadingState(false);
    }
  }

  async handleEnvironmentFormSubmit(event) {
    event.preventDefault();
    if (!navigator.onLine) {
      this.showError('No internet connection. Please check and try again.');
      return;
    }

    this.toggleEnvironmentLoadingState(true);
    this.hideError();

    const predefinedEnvironments = Array.from(
      document.querySelectorAll('.predefined-env:checked')
    ).map(cb => ({
      name: cb.value,
      createdBy: 'system',
      description: `${cb.value.charAt(0).toUpperCase() + cb.value.slice(1)} environment`,
    }));

    const customEnvironments = Array.from(document.querySelectorAll('.custom-environment'))
      .map(envCard => {
        const name = envCard.querySelector('.custom-env-name')?.value.trim();
        const desc = envCard.querySelector('.custom-env-description')?.value.trim() || '';
        return name ? { name, description: desc, createdBy: 'system' } : null;
      })
      .filter(Boolean);

    const environments = [...predefinedEnvironments, ...customEnvironments];
    if (!environments.length) {
      this.showError('Please select at least one environment.');
      this.toggleEnvironmentLoadingState(false);
      return;
    }

    try {
      const createEnvPromises = [];
      for (const env of environments) {
        if (createEnvPromises.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        createEnvPromises.push(
          fetch('/api/v1/flags/environments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-API-Key': this.API_KEY,
            },
            body: JSON.stringify(env),
          })
        );
      }

      const results = await Promise.allSettled(createEnvPromises);

      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount > 0) {
        this.showError(`Failed to create ${failedCount} environment(s). Some may have succeeded.`);
        this.toggleEnvironmentLoadingState(false);
      } else {
        try {
          await loginAndSaveTokens(this.adminData.email, this.adminData.password, false);
        } catch (error) {
          this.showError(`Setup completed, but login failed: ${error.message}`);
          this.toggleEnvironmentLoadingState(false);
        }
      }
    } catch (error) {
      console.error('Environment creation error:', error);
      this.showError('Error creating environments. Try again later.');
      this.toggleEnvironmentLoadingState(false);
    }
  }

  navigateToStep(step) {
    this.currentStep = step;
    ['step1Form', 'step2Form', 'step3Complete'].forEach(id =>
      this.elements[id].classList.add('d-none')
    );
    [1, 2, 3].forEach(i =>
      this.elements[`step${i}Indicator`].classList.remove('active', 'complete')
    );
    for (let i = 1; i < step; i++) this.elements[`step${i}Indicator`].classList.add('complete');
    this.elements[`step${step}Indicator`].classList.add('active');
    this.elements[`step${step}Form` || `step${step}Complete`].classList.remove('d-none');
    this.elements.progressBar.style.width = `${step * 33}%`;
    this.elements.progressBar.setAttribute('aria-valuenow', step * 33);
    if (step === 3) setTimeout(() => (window.location.href = '/login'), 3000);
    this.hideError();
  }

  addCustomEnvironment() {
    const clone = document.importNode(this.elements.customEnvTemplate.content, true);
    this.elements.customEnvironmentsContainer.appendChild(clone);
  }

  validateAdminForm() {
    const username = this.elements.adminForm.username.value.trim();
    if (username.length < 3) {
      this.showError('Username must be at least 3 characters');
      return false;
    }
    const email = this.elements.adminForm.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError('Invalid email address');
      return false;
    }
    const password = this.elements.adminForm.password.value;
    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      this.showError('Password must be 8+ chars with letters, numbers, and special chars');
      return false;
    }
    return true;
  }

  validatePassword(password) {
    let strength = 0;
    const feedback = [];
    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');
    if (/[a-zA-Z]/.test(password)) strength++;
    else feedback.push('Add letters');
    if (/\d/.test(password)) strength++;
    else feedback.push('Add numbers');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    else feedback.push('Add special characters');
    this.updatePasswordStrengthUI(strength, feedback);
  }

  updatePasswordStrengthUI(strength, feedback) {
    const meter = this.elements.passwordStrengthMeter;
    meter.className = 'progress-bar';
    meter.style.width = `${strength * 25}%`;
    const levels = [
      'bg-danger Very weak',
      'bg-danger Weak',
      'bg-warning Average',
      'bg-info Good',
      'bg-success Strong',
    ];
    const [className, text] = levels[strength].split(' ');
    meter.classList.add(className);
    meter.textContent = text;
    this.elements.passwordFeedback.innerHTML = feedback.length
      ? feedback.map(item => `<div>${item}</div>`).join('')
      : '';
  }

  setupPasswordToggle() {
    const toggleButton = this.elements.togglePasswordButton;
    const passwordInput = this.elements.passwordInput;
    const toggleIcon = toggleButton?.querySelector('i');
    if (!toggleButton || !passwordInput || !toggleIcon) return;

    toggleButton.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleIcon.classList.toggle('bi-eye', !isPassword);
      toggleIcon.classList.toggle('bi-eye-slash', isPassword);
    });
  }

  setupPasswordGenerator() {
    const generateButton = this.elements.generatePasswordButton;
    const passwordInput = this.elements.passwordInput;
    if (!generateButton || !passwordInput) return;

    generateButton.addEventListener('click', e => {
      e.preventDefault();
      const password = this.generateSecurePassword();
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      navigator.clipboard
        .writeText(password)
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
        .catch(err => console.error('Clipboard error:', err));
    });
  }

  generateSecurePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?';
    let password = 'aA1!';
    for (let i = 4; i < 16; i++) password += chars[Math.floor(Math.random() * chars.length)];
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  showError(message) {
    this.elements.errorContainer.innerHTML = this.escapeHTML(message);
    this.elements.errorContainer.classList.remove('d-none', 'alert-success');
    this.elements.errorContainer.classList.add('alert-danger');
    this.elements.errorContainer.setAttribute('aria-live', 'assertive');
    this.elements.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideError() {
    this.elements.errorContainer.textContent = '';
    this.elements.errorContainer.classList.add('d-none');
  }

  toggleAdminLoadingState(isLoading) {
    this.elements.submitAdminButton.disabled = isLoading;
    this.elements.adminSpinner.classList.toggle('d-none', !isLoading);
    this.elements.adminButtonText.textContent = isLoading
      ? 'Creating...'
      : 'Continue to Environment Setup';
  }

  toggleEnvironmentLoadingState(isLoading) {
    this.elements.submitEnvironmentButton.disabled = isLoading;
    this.elements.envSpinner.classList.toggle('d-none', !isLoading);
    this.elements.envButtonText.textContent = isLoading ? 'Creating...' : 'Complete Setup';
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  escapeHTML(str) {
    return str.replace(
      /[&<>"']/g,
      match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match]
    );
  }
}

document.addEventListener('DOMContentLoaded', () => new SetupApp());
