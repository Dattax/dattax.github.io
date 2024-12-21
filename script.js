document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    mobileMenu.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Close mobile menu if open
                navLinks.style.display = 'none';
            }
        });
    });

    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Add your form submission logic here
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Contact Form Handling
    const contactForm2 = document.getElementById('contactForm');
    if (contactForm2) {
        contactForm2.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                company: document.getElementById('company').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            // Here you would typically send the form data to your backend
            console.log('Form submitted:', formData);
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            contactForm2.reset();
        });
    }

    // Scroll-based navbar styling
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });

    // FAQ Functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Calendar and Scheduling Functionality
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthElement = document.getElementById('currentMonth');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const scheduleButton = document.getElementById('schedule-button');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;
    
    // Initialize calendar
    function initCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthElement.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dateToCheck = new Date(year, month, day);
            const today = new Date();
            
            // Disable past dates and weekends
            if (dateToCheck < today || dateToCheck.getDay() === 0 || dateToCheck.getDay() === 6) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(year, month, day));
            }
            
            calendarDays.appendChild(dayElement);
        }
    }
    
    // Handle date selection
    function selectDate(year, month, day) {
        const selectedDateElement = document.querySelector('.calendar-day.selected');
        if (selectedDateElement) {
            selectedDateElement.classList.remove('selected');
        }
        
        const dayElement = Array.from(document.querySelectorAll('.calendar-day')).find(el => el.textContent === day.toString());
        dayElement.classList.add('selected');
        
        selectedDate = new Date(year, month, day);
        generateTimeSlots();
        updateScheduleButton();
    }
    
    // Generate available time slots
    function generateTimeSlots() {
        timeSlotsContainer.innerHTML = '';
        const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
        
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            slot.addEventListener('click', () => {
                const selectedSlot = document.querySelector('.time-slot.selected');
                if (selectedSlot) {
                    selectedSlot.classList.remove('selected');
                }
                slot.classList.add('selected');
                selectedTime = time;
                updateScheduleButton();
            });
            
            timeSlotsContainer.appendChild(slot);
        });
    }
    
    // Update schedule button state
    function updateScheduleButton() {
        const isFormValid = nameInput.value && emailInput.value && phoneInput.value;
        scheduleButton.disabled = !selectedDate || !selectedTime || !isFormValid;
    }
    
    // Add event listeners
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        initCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        initCalendar();
    });
    
    [nameInput, emailInput, phoneInput].forEach(input => {
        input.addEventListener('input', updateScheduleButton);
    });
    
    scheduleButton.addEventListener('click', () => {
        // Here you would typically send the form data to your backend
        const formData = {
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            date: selectedDate,
            time: selectedTime
        };
        
        console.log('Scheduling meeting with:', formData);
        alert('Thank you! We will confirm your meeting shortly.');
    });
    
    // Initialize the calendar
    initCalendar();
});

// Navigation Menu Functionality
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Mobile dropdown toggle
    if (window.innerWidth <= 768) {
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });
    
    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-up');
            navbar.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-down');
            navbar.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });
});
