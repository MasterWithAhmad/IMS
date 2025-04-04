// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add click event to sidebar toggle on mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('show');
        });
    }

    // Format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Update stat card numbers with animation
    const statNumbers = document.querySelectorAll('.stat-card .card-text');
    statNumbers.forEach(number => {
        const finalValue = parseFloat(number.textContent.replace(/[^0-9.-]+/g, ""));
        let currentValue = 0;
        const duration = 1000; // 1 second
        const steps = 60;
        const increment = finalValue / steps;
        const stepTime = duration / steps;

        const animate = () => {
            currentValue += increment;
            if (currentValue < finalValue) {
                number.textContent = formatNumber(Math.round(currentValue));
                setTimeout(animate, stepTime);
            } else {
                number.textContent = formatNumber(finalValue);
            }
        };

        animate();
    });
}); 