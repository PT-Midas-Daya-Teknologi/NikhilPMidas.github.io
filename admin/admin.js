document.addEventListener('DOMContentLoaded', function() {
    // Detect Page Reload and force logout
    if (performance.getEntriesByType("navigation")[0].type === 'reload') {
        window.location.href = 'logout.php';
        return;
    }

    // Handle delete confirmations
    const deleteForms = document.querySelectorAll('form[data-confirm]');
    deleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const message = this.getAttribute('data-confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // Populate Edit Modal
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('edit-id').value = this.getAttribute('data-id');
            document.getElementById('edit-title').value = this.getAttribute('data-title');
            document.getElementById('edit-department').value = this.getAttribute('data-department');
            document.getElementById('edit-type').value = this.getAttribute('data-type');
            document.getElementById('edit-location').value = this.getAttribute('data-location');
        });
    });

    // Handle alert auto-dismiss (optional)
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeBtn = alert.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        }, 5000);
    });
});
