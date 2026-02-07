document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'student_login.html';
        return;
    }

    async function loadProfile() {
        try {
            const res = await fetch(`${API_URL}/profile/me`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to load profile');

            const profile = await res.json();

            // Populate Fields
            const name = profile.fullName || profile.userId.name;
            const email = profile.userId.email;

            document.getElementById('profile-name').textContent = name;
            document.getElementById('profile-email').textContent = email;

            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            document.getElementById('profile-avatar').textContent = initials;

            if (profile.year) document.getElementById('profile-year').textContent = profile.year;
            if (profile.branch) document.getElementById('profile-dept').textContent = profile.branch; // Note: Model has 'branch', UI has 'dept'

            // Interests
            if (profile.skills && profile.skills.length > 0) {
                document.getElementById('profile-bio').textContent = `Passionate about ${profile.skills.join(', ')} and technology.`;

                const interestsContainer = document.getElementById('profile-interests-list');
                if (interestsContainer) {
                    interestsContainer.innerHTML = '';
                    profile.skills.forEach(interest => {
                        const tag = document.createElement('div');
                        tag.className = 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-full text-sm flex items-center gap-2 cursor-pointer transition-colors group';
                        tag.innerHTML = `
                            ${interest}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        `;
                        interestsContainer.appendChild(tag);
                    });
                }
            }

        } catch (err) {
            console.error(err);
        }
    }

    loadProfile();
});
