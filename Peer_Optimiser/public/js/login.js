function handleLogin(event) {
    event.preventDefault();
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email_error');
    const email = emailInput.value.trim();
    const password = document.getElementById('password').value;

    // Reset Validation
    emailError.classList.add('hidden');
    emailInput.classList.remove('border-red-500');

    if (!email.endsWith('@iiitkota.ac.in')) {
        emailError.textContent = 'Login is restricted to IIIT Kota students (@iiitkota.ac.in).';
        emailError.classList.remove('hidden');
        emailInput.classList.add('border-red-500');
        return;
    }

    if (email && password) {
        // API Call
        const API_URL = 'http://localhost:5000/api'; // Should be global constant ideally

        async function loginUser() {
            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Login Failed');
                }

                // Save Token
                localStorage.setItem('token', data.token);

                // Redirect
                window.location.href = 'student_dashboard.html';

            } catch (err) {
                alert(err.message);
            }
        }

        loginUser();
    } else {
        alert('Please fill in all fields');
    }
}
