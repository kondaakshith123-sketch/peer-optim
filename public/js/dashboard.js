document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'student_login.html';
        return;
    }

    let fullDaySchedule = [];

    // --- Core Logic: 9-5 Slot Generation ---
    function generateFullDaySchedule(apiSchedule) {
        const slots = [];
        const startHour = 9;
        const endHour = 17; // 5 PM

        for (let h = startHour; h < endHour; h++) {
            // 24-hour format for matching (e.g., "09:00", "13:00")
            const startH24 = h.toString().padStart(2, '0');
            const endH24 = (h + 1).toString().padStart(2, '0');
            const startTime24 = `${startH24}:00`;
            const endTime24 = `${endH24}:00`;

            // Display format (e.g., "9:00 AM", "1:00 PM")
            const displayStart = `${h < 12 ? h : h === 12 ? 12 : h - 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
            const displayEnd = `${h + 1 < 12 ? h + 1 : h + 1 === 12 ? 12 : h + 1 - 12}:00 ${h + 1 < 12 ? 'AM' : 'PM'}`;

            // Check if there is a class in this slot
            // Robust matching: Check if API time (standardized) matches our slot start
            const existingClass = apiSchedule.find(s => {
                // Normalize API time to "HH:MM" 24-hour format if possible, or just compare
                // Assuming API returns "HH:MM" (e.g., "09:00" or "13:00")
                // trimming just in case
                if (!s.startTime) return false;
                return s.startTime.trim() === startTime24 || s.startTime.trim() === displayStart;
            });

            if (existingClass) {
                slots.push({
                    type: 'class',
                    ...existingClass,
                    startTime: displayStart, // Use display format for UI
                    endTime: displayEnd
                });
            } else {
                slots.push({
                    type: 'free',
                    subject: 'Free Slot',
                    startTime: displayStart,
                    endTime: displayEnd
                });
            }
        }
        return slots;
    }

    // --- Real-time Status Update ---
    function updateCurrentStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        const label = document.getElementById('current-status-label');
        const display = document.getElementById('current-status-display');
        const bubbles = document.getElementById('current-status-bubbles');

        if (!label || !display || !bubbles) return;

        // Check if outside 9-5
        if (currentHour < 9 || currentHour >= 17) {
            label.textContent = "Current Status";
            display.textContent = "Outside College Hours";
            bubbles.innerHTML = '<span class="bg-white/20 px-3 py-1 rounded-full">See you tomorrow!</span>';
            return;
        }

        // Find current slot
        const currentSlotIndex = currentHour - 9;
        const currentSlot = fullDaySchedule[currentSlotIndex];

        if (currentSlot) {
            if (currentSlot.type === 'free') {
                label.textContent = "Current Status: Free";
                display.textContent = "Free / Idle Time";
            } else {
                label.textContent = `Current Class`;
                display.textContent = currentSlot.subject;
            }

            // Show next 3 slots in bubbles
            const nextSlots = fullDaySchedule.slice(currentSlotIndex + 1, currentSlotIndex + 4);
            bubbles.innerHTML = nextSlots.map(s =>
                `<span class="bg-white/20 px-3 py-1 rounded-full text-xs">${s.startTime}: ${s.type === 'free' ? 'Free' : s.subject}</span>`
            ).join('');
        }
    }


    let userInterests = [];

    // --- Fetch User Profile ---
    async function fetchProfile() {
        try {
            const res = await fetch(`${API_URL}/profile/me`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch profile');

            const profile = await res.json();
            const userName = profile.fullName || profile.userId.name;
            userInterests = profile.skills || [];

            const nameElement = document.getElementById('user-name-display');
            if (nameElement) nameElement.textContent = userName;

            const avatarElement = document.getElementById('user-avatar-display');
            if (avatarElement) avatarElement.textContent = userName.charAt(0).toUpperCase();

            // Populate Interest Select in Modal
            const interestSelect = document.getElementById('group-interest-select');
            if (interestSelect) {
                interestSelect.innerHTML = userInterests.map(tag =>
                    `<option value="${tag}">${tag}</option>`
                ).join('');
                if (userInterests.length === 0) {
                    interestSelect.innerHTML = '<option disabled>No interests in profile</option>';
                }
            }

        } catch (err) {
            console.error(err);
        }
    }

    // --- Fetch and Render Schedule ---
    async function fetchSchedule() {
        try {
            const today = 'MON'; // Hardcoded for demo
            const res = await fetch(`${API_URL}/timetable/my?day=${today}`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch schedule');

            const apiSchedule = await res.json();
            fullDaySchedule = generateFullDaySchedule(apiSchedule);
            renderScheduleList(fullDaySchedule);
            updateCurrentStatus();
        } catch (err) {
            console.error('Error fetching schedule:', err);
        }
    }

    function renderScheduleList(schedule) {
        const container = document.getElementById('schedule-list-container');
        if (!container) return;
        container.innerHTML = '';
        if (schedule.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No schedule data available.</p>';
            return;
        }
        schedule.forEach(slot => {
            const item = document.createElement('div');
            if (slot.type === 'free') {
                item.className = 'flex items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50';
                item.innerHTML = `
                    <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-slate-800 text-sm">Free Slot</h3>
                        <p class="text-xs text-slate-500">${slot.startTime} - ${slot.endTime}</p>
                    </div>
                    <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Free</span>`;
            } else {
                item.className = 'schedule-item group flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100';
                item.innerHTML = `
                    <div class="schedule-icon-wrapper bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-slate-800 text-sm">${slot.subject}</h3>
                        <p class="text-xs text-slate-500">${slot.startTime} - ${slot.endTime}</p>
                    </div>`;
            }
            container.appendChild(item);
        });
    }

    async function fetchMatches() {
        try {
            const res = await fetch(`${API_URL}/match`, { headers: { 'x-auth-token': token } });
            if (!res.ok) throw new Error('Failed to fetch matches');
            const matches = await res.json();
            const container = document.getElementById('suggested-peers-container');
            if (container) {
                container.innerHTML = matches.length === 0 ? '<p class="text-slate-500 col-span-full text-center">No matches found.</p>' : '';
                matches.forEach(match => {
                    const card = document.createElement('div');
                    card.className = 'bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer';
                    card.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-slate-800 text-sm">${match.name}</h3>
                                <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">${match.commonInterests[0] || 'Peer'}</span>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 mb-3">Free: ${match.commonFreeSlot.start} - ${match.commonFreeSlot.end}</p>
                        <div class="text-xs text-indigo-600 font-medium tracking-tight">Connect with Match</div>`;
                    container.appendChild(card);
                });
            }
        } catch (err) { console.error(err); }
    }

    async function fetchPeersFreeNow() {
        try {
            const res = await fetch(`${API_URL}/match/free-now`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            const countEl = document.getElementById('peers-free-count');
            if (countEl) countEl.textContent = data.count;
            const avatars = document.getElementById('peers-free-avatars');
            if (avatars) {
                avatars.innerHTML = data.peers.map(p => `<div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold border-2 border-white text-xs" title="${p.name}">${p.name.charAt(0)}</div>`).join('');
            }
        } catch (err) { console.error(err); }
    }

    // Notification System
    const notifiedSlots = new Set();
    function checkUpcomingFreeSlots() {
        const now = new Date();
        const curMin = now.getHours() * 60 + now.getMinutes();
        fullDaySchedule.forEach(slot => {
            if (slot.type === 'free') {
                const [time, period] = slot.startTime.split(' ');
                let [h, m] = time.split(':').map(Number);
                if (period === 'PM' && h !== 12) h += 12;
                const diff = (h * 60 + m) - curMin;
                if (diff > 0 && diff <= 10 && !notifiedSlots.has(slot.startTime)) {
                    showNotification(diff); notifiedSlots.add(slot.startTime);
                }
            }
        });
    }

    function showNotification(m) {
        const modal = document.getElementById('free-slot-notification');
        const span = document.getElementById('notification-time-left');
        if (modal && span) {
            span.textContent = `${m} mins`;
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('translate-y-full', 'opacity-0'), 100);
        }
    }

    function setupNotificationHandlers() {
        ['notification-no-btn', 'notification-close-btn', 'notification-yes-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => {
                const modal = document.getElementById('free-slot-notification');
                modal.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 500);
            };
        });
    }

    async function fetchActiveGroups() {
        try {
            const res = await fetch(`${API_URL}/groups/active`, {
                headers: { 'x-auth-token': token }
            });
            if (!res.ok) throw new Error('Failed to fetch groups');
            const groups = await res.json();
            renderGroups(groups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    }

    function renderGroups(groups) {
        const container = document.getElementById('active-groups-container');
        if (!container) return;

        if (groups.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-slate-400 text-sm">No active groups for your interests yet.</p>
                </div>`;
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-slate-800 text-sm">Group for ${group.interestTag}</h3>
                    <div class="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expires: ${new Date(group.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="flex justify-between items-end">
                    <div class="flex items-center gap-2">
                        <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">${group.interestTag}</span>
                        <span class="text-xs text-slate-500">${group.members.length} member(s)</span>
                    </div>
                    <button onclick="joinGroup('${group._id}')" class="px-4 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                        Join
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.joinGroup = async (groupId) => {
        try {
            const res = await fetch(`${API_URL}/groups/join/${groupId}`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (!res.ok) alert(data.msg || 'Failed to join');
            else {
                alert('Joined group successfully!');
                fetchActiveGroups();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Modal Handlers
    const modal = document.getElementById('create-group-modal');
    const openBtn = document.getElementById('open-create-group-modal');
    const closeBtn = document.getElementById('close-create-group-modal');
    const form = document.getElementById('create-group-form');

    if (openBtn) openBtn.onclick = () => modal.classList.remove('hidden');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                interestTag: document.getElementById('group-interest-select').value,
                duration: document.getElementById('group-duration').value
            };

            try {
                const res = await fetch(`${API_URL}/groups/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.msg || 'Creation failed');
                } else {
                    alert('Group created! Waiting for others to join...');
                    modal.classList.add('hidden');
                    fetchActiveGroups();
                }
            } catch (err) {
                console.error(err);
            }
        };
    }

    // Init Logic
    fetchProfile(); fetchSchedule(); fetchMatches(); fetchPeersFreeNow(); fetchActiveGroups(); setupNotificationHandlers();
    setInterval(() => { updateCurrentStatus(); checkUpcomingFreeSlots(); fetchActiveGroups(); fetchPeersFreeNow(); }, 60000);
});

