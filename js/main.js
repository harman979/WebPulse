/**
 * WebPulse — Main UI Module
 * Handles shared responsive navigation, theme initializations, and utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Responsive Navbar Toggle
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const isOpen = mainNav.classList.contains('open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });
    }
});
