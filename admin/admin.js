document.addEventListener('DOMContentLoaded', function () {

    // Handle delete confirmations for all forms with data-confirm attribute
    const confirmForms = document.querySelectorAll('form[data-confirm]');
    confirmForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            const msg = this.getAttribute('data-confirm') || 'Are you sure?';
            if (!confirm(msg)) {
                e.preventDefault();
            }
        });
    });

    // Populate Edit Modal fields (used on dashboard / job pages)
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const setVal = (id, attr) => {
                const el = document.getElementById(id);
                if (el) el.value = this.getAttribute(attr) || '';
            };
            setVal('edit-id',         'data-id');
            setVal('edit-title',      'data-title');
            setVal('edit-department', 'data-department');
            setVal('edit-type',       'data-type');
            setVal('edit-location',   'data-location');
        });
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const closeBtn = alert.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        }, 5000);
    });

});
