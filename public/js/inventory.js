document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Stock adjustment validation
    const stockAdjustForms = document.querySelectorAll('form[action*="adjust-stock"]');
    stockAdjustForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const quantity = parseInt(this.querySelector('input[name="quantity"]').value);
            const type = this.querySelector('select[name="type"]').value;
            const currentStock = parseInt(this.closest('tr').querySelector('td:nth-child(4)').textContent);

            if (type === 'out' && quantity > currentStock) {
                event.preventDefault();
                alert('Cannot remove more items than current stock!');
            }
        });
    });

    // Search functionality
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Sort functionality
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            const tbody = this.closest('table').querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const isAsc = this.dataset.order === 'asc';

            rows.sort((a, b) => {
                const aValue = a.querySelector(`td[data-${column}]`).dataset[column];
                const bValue = b.querySelector(`td[data-${column}]`).dataset[column];

                if (isAsc) {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });

            // Update sort order
            this.dataset.order = isAsc ? 'desc' : 'asc';
            this.querySelector('i').className = isAsc ? 'fas fa-sort-down' : 'fas fa-sort-up';

            // Reorder rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}); 