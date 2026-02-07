// Toggle Other Interest Input
function toggleOtherInterest(checkbox) {
    const otherInputDiv = document.getElementById('other_interest_div');
    if (checkbox.checked) {
        otherInputDiv.classList.remove('hidden');
    } else {
        otherInputDiv.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const batchSelect = document.getElementById('batch');
    const subBatchSelect = document.getElementById('sub_batch');
    const registerForm = document.getElementById('registerForm');

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validate Email Domain
            const emailInput = document.getElementById('reg_email');
            const emailError = document.getElementById('email_error');
            const email = emailInput.value.trim();

            // Reset error
            emailError.classList.add('hidden');
            emailInput.classList.remove('border-red-500');

            if (!email.endsWith('@iiitkota.ac.in')) {
                emailError.textContent = 'Registration is restricted to IIIT Kota students (@iiitkota.ac.in).';
                emailError.classList.remove('hidden');
                emailInput.classList.add('border-red-500');
                return;
            }

            // Collect Form Data
            const name = document.getElementById('reg_name').value;
            // password and email are already collected/validated above

            // Collect Interests
            const checkboxes = document.querySelectorAll('input[name="interest"]:checked');
            let interests = [];
            checkboxes.forEach((checkbox) => {
                if (checkbox.value === 'Others') {
                    const otherVal = document.getElementById('other_interest').value;
                    if (otherVal) interests.push(otherVal);
                } else {
                    interests.push(checkbox.value);
                }
            });

            if (interests.length === 0) {
                alert('Please select at least one interest.');
                return;
            }

            // API Call through fetch
            const API_URL = 'http://localhost:5000/api';

            const password = document.getElementById('reg_password').value;
            const confirmPassword = document.getElementById('reg_confirm_password').value;
            const passwordError = document.getElementById('password_error');

            // Reset Password Error
            passwordError.classList.add('hidden');
            document.getElementById('reg_confirm_password').classList.remove('border-red-500');

            if (password !== confirmPassword) {
                passwordError.textContent = "Passwords do not match.";
                passwordError.classList.remove('hidden');
                document.getElementById('reg_confirm_password').classList.add('border-red-500');
                return;
            }

            const payload = {
                name,
                email,
                password
            };

            async function registerUser() {
                try {
                    console.log('Attempting Signup...');
                    // 1. Signup
                    const signupRes = await fetch(`${API_URL}/auth/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    let signupData;
                    const contentType = signupRes.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        signupData = await signupRes.json();
                    } else {
                        const text = await signupRes.text();
                        throw new Error('Server returned non-JSON response: ' + text);
                    }

                    if (!signupRes.ok) {
                        throw new Error(signupData.msg || 'Signup Failed');
                    }

                    console.log('Signup Successful, Token received.');
                    const token = signupData.token;

                    // 2. Update Profile with interests
                    console.log('Updating Profile Interests...');
                    const profileRes = await fetch(`${API_URL}/profile/update`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            skills: interests
                        })
                    });

                    if (!profileRes.ok) {
                        console.error('Profile update failed', await profileRes.text());
                        // We don't block registration success if profile update fails, but good to know
                    } else {
                        console.log('Profile Updated.');
                    }

                    alert('Registration Successful! Your batch and details were automatically mapped. Redirecting to Login...');
                    window.location.href = 'student_login.html';

                } catch (err) {
                    console.error('Registration Error:', err);
                    alert(`Registration Failed: ${err.message}. Ensure backend is running.`);
                    emailError.textContent = err.message;
                    emailError.classList.remove('hidden');
                }
            }


            registerUser();
        });

    }

    const subBatchOptions = {
        'A': ['A1', 'A2', 'A3'],
        'B': ['B1', 'B2', 'B3'],
        'C': ['C1', 'C2', 'C3'],
        'D': ['D1', 'D2']
    };

    if (batchSelect) {
        batchSelect.addEventListener('change', function () {
            const selectedBatch = this.value;

            // Clear existing options
            subBatchSelect.innerHTML = '<option value="" disabled selected>Select Sub Batch</option>';

            if (selectedBatch && subBatchOptions[selectedBatch]) {
                // Enable the select
                subBatchSelect.disabled = false;

                // Add new options
                subBatchOptions[selectedBatch].forEach(function (subBatch) {
                    const option = document.createElement('option');
                    option.value = subBatch;
                    option.textContent = subBatch;
                    subBatchSelect.appendChild(option);
                });
            } else {
                // Disable if no batch selected
                subBatchSelect.disabled = true;
                subBatchSelect.innerHTML = '<option value="" disabled selected>Select Batch First</option>';
            }
        });
    }
});
