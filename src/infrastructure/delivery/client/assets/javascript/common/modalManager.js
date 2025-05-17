class ModalManager {
  constructor(config = {}) {
    this.config = {
      toastDelay: 5000,
      descriptionMaxLength: 200,
      descriptionWarningThreshold: 180,
      modalConfigs: {
        createUserModal: {
          formId: 'createUserForm',
          successMessage: 'User created successfully',
          apiPath: '/api/v1/users/',
        },
        createGroupModal: {
          formId: 'createGroupForm',
          successMessage: 'Group created successfully',
          apiPath: '/api/v1/group/',
        },
        groupMembersModal: {
          loading: true,
        },
        groupEditModal: {
          hxTarget: 'groupEditModal',
        },
      },
      ...config,
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeTooltips();
  }

  setupEventListeners() {
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', () => this.togglePassword(button));
    });

    // Form submission
    document.querySelectorAll('.modal-submit-btn').forEach(button => {
      button.addEventListener('click', () => this.handleFormSubmit(button));
    });

    // Description character counter
    document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
      textarea.addEventListener('input', () => this.updateCharacterCounter(textarea));
    });

    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
      userSearch.addEventListener('input', () => this.handleUserSearch(userSearch));
    }

    // HTMX events
    document.body.addEventListener('htmx:afterOnLoad', event => this.handleHtmxResponse(event));
    document.body.addEventListener('htmx:beforeSwap', event => this.handleHtmxDelete(event));
  }

  togglePassword(button) {
    const passwordInput = button
      .closest('.input-group')
      .querySelector('input[type="password"], input[type="text"]');
    const icon = button.querySelector('i');
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    icon.classList.toggle('bi-eye', !isPassword);
    icon.classList.toggle('bi-eye-slash', isPassword);
  }

  handleFormSubmit(button) {
    const modal = button.closest('.modal');
    const form = modal.querySelector('form');
    if (!form || !form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
    } else {
      form.dispatchEvent(new Event('submit'));
    }
  }

  updateCharacterCounter(textarea) {
    const counter = textarea.parentElement.querySelector('.char-counter');
    if (!counter) return;
    const currentLength = textarea.value.length;
    counter.textContent = currentLength;
    counter.classList.toggle(
      'text-danger',
      currentLength >= this.config.descriptionWarningThreshold
    );
  }

  handleUserSearch(input) {
    const searchTerm = input.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tbody tr:not(#no-users-row)');
    let visibleCount = 0;

    rows.forEach(row => {
      const username = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
      const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const groups = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      const role = row.querySelector('td:nth-child(4)').textContent.toLowerCase();

      if (
        username.includes(searchTerm) ||
        email.includes(searchTerm) ||
        groups.includes(searchTerm) ||
        role.includes(searchTerm)
      ) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const noResultsRow = document.querySelector('#no-results-row');
    if (visibleCount === 0 && rows.length > 0) {
      if (!noResultsRow) {
        const tbody = document.querySelector('#usersTable tbody');
        const newRow = document.createElement('tr');
        newRow.id = 'no-results-row';
        newRow.innerHTML = `
          <td colspan="5" class="text-center py-4">
            <div class="d-flex flex-column align-items-center">
              <i class="bi bi-search fs-2 mb-2 text-muted"></i>
              <p class="mb-0">No users match "${input.value}"</p>
            </div>
          </td>
        `;
        tbody.appendChild(newRow);
      }
    } else if (noResultsRow) {
      noResultsRow.remove();
    }
  }

  handleHtmxResponse(event) {
    const modalConfig = Object.values(this.config.modalConfigs).find(
      cfg => cfg.apiPath && event.detail.requestConfig.path === cfg.apiPath
    );

    if (event.detail.xhr.status === 201 || event.detail.xhr.status === 200) {
      if (modalConfig) {
        const modal = document.getElementById(modalConfig.formId.replace('Form', 'Modal'));
        const form = modal.querySelector('form');
        bootstrap.Modal.getInstance(modal).hide();
        form.reset();
        form.classList.remove('was-validated');
        this.showToast('Success', modalConfig.successMessage, 'success');
        window.location.reload();
      }
    } else if (event.detail.xhr.status >= 400) {
      try {
        const response = JSON.parse(event.detail.xhr.responseText);
        this.showToast('Error', response.message || 'An error occurred', 'danger');
      } catch (e) {
        this.showToast('Error', 'An unexpected error occurred', 'danger');
      }
    }
  }

  handleHtmxDelete(event) {
    if (
      event.detail.requestConfig.verb === 'delete' &&
      event.detail.requestConfig.path.startsWith('/api/v1/users/')
    ) {
      if (event.detail.xhr.status === 200 || event.detail.xhr.status === 204) {
        this.showToast('Success', 'User deleted successfully', 'success');
      } else {
        event.detail.shouldSwap = false;
        try {
          const response = JSON.parse(event.detail.xhr.responseText);
          this.showToast('Error', response.message || 'Failed to delete user', 'danger');
        } catch (e) {
          this.showToast('Error', 'Failed to delete user', 'danger');
        }
      }
    }
  }

  showToast(title, message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${title}:</strong> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: this.config.toastDelay,
    });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  initializeTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[title]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

// Initialize ModalManager
document.addEventListener('DOMContentLoaded', () => {
  new ModalManager();
});
