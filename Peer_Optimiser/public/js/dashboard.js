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


    // --- Fetch User Profile ---
    async function fetchProfile() {
        try {
            const res = await fetch(`${API_URL}/profile/me`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch profile');

            const profile = await res.json();
            const userName = profile.fullName || profile.userId.name;

            const nameElement = document.getElementById('user-name-display');
            if (nameElement) nameElement.textContent = userName;

            const avatarElement = document.getElementById('user-avatar-display');
            if (avatarElement) avatarElement.textContent = userName.charAt(0).toUpperCase();

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

            // Generate 9-5 slots merging with API data
            fullDaySchedule = generateFullDaySchedule(apiSchedule);

            // Render the list
            renderScheduleList(fullDaySchedule);

            // Update status immediately and then every minute
            updateCurrentStatus();
            setInterval(updateCurrentStatus, 60000); // Update every minute

        } catch (err) {
            console.error('Error fetching schedule:', err);
        }
    }

    // --- Render Schedule List ---
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
                // Render Free Slot
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
                    <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Free</span>
                `;
            } else {
                // Render Class Slot
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
                    </div>
                `;
            }
            container.appendChild(item);
        });
    }


    // --- Fetch Matches (Keep existing) ---
    async function fetchMatches() {
        try {
            const res = await fetch(`${API_URL}/match`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch matches');

            const matches = await res.json();
            const container = document.getElementById('suggested-peers-container');

            if (container) {
                container.innerHTML = '';

                if (matches.length === 0) {
                    container.innerHTML = '<p class="text-slate-500 col-span-full text-center">No matches found at the moment. Try updating your interests!</p>';
                    return;
                }

                matches.forEach(match => {
                    const card = document.createElement('div');
                    card.className = 'bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer';

                    const mainInterest = match.commonInterests.length > 0 ? match.commonInterests[0] : 'Peer';

                    card.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-slate-800 text-sm">${match.name} (${match.subBatch})</h3>
                                <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">${mainInterest}</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                        <p class="text-xs text-slate-500 mb-3">
                            <span class="font-semibold text-emerald-600">Free: ${match.commonFreeSlot.start} - ${match.commonFreeSlot.end}</span><br>
                            Common: ${match.commonInterests.join(', ')}
                        </p>
                        <div class="text-xs text-indigo-600 font-medium flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8H8c-4.418 0-8-3.582-8-8V8c0-4.418 3.582-8 8-8 3.582 0 6.418 2.502 7.125 5.813"/>
                            </svg>
                            Connect
                        </div>
                    `;
                    container.appendChild(card);
                });
            }

        } catch (err) {
            console.error('Error fetching matches:', err);
        }
    }

    // --- Fetch Peers Free Now ---
    async function fetchPeersFreeNow() {
        try {
            const res = await fetch(`${API_URL}/match/free-now`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch free peers');

            const data = await res.json();

            // Update Count
            const countElement = document.getElementById('peers-free-count');
            if (countElement) {
                // Animate count? Simple text update for now
                countElement.textContent = data.count;
            }

            // Update Avatars
            const avatarsContainer = document.getElementById('peers-free-avatars');
            if (avatarsContainer) {
                avatarsContainer.innerHTML = '';

                if (data.peers.length === 0) {
                    // Keep empty or show placeholder?
                } else {
                    data.peers.forEach(peer => {
                        const initial = peer.name.charAt(0).toUpperCase();

                        // Generate random-ish color based on name length or something simple
                        const colors = ['bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700'];
                        const colorClass = colors[peer.name.length % colors.length];

                        const avatar = document.createElement('div');
                        avatar.className = `w-10 h-10 rounded-full ${colorClass} flex items-center justify-center font-semibold border-2 border-white text-xs`;
                        avatar.textContent = initial;
                        avatar.title = `${peer.name} (${peer.batch}-${peer.subBatch})`; // Tooltip
                        avatarsContainer.appendChild(avatar);
                    });

                    // If more than 5 (though API limits to 5, but if count > 5 we can show +X)
                    if (data.count > 5) {
                        const extra = document.createElement('div');
                        extra.className = 'w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold border-2 border-white text-xs hover:bg-slate-200 cursor-pointer transition-colors';
                        extra.textContent = `+${data.count - 5}`;
                        avatarsContainer.appendChild(extra);
                    }
                }
            }

        } catch (err) {
            console.error('Error fetching free peers:', err);
        }
    }

    // --- Notification System ---
    const notifiedSlots = new Set();

    function checkUpcomingFreeSlots() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMin;

        fullDaySchedule.forEach(slot => {
            if (slot.type === 'free') {
                // Parse slot start time
                // slot.startTime is "HH:MM AM/PM"
                // detailed parsing needed or use known hour index
                // Since we generated slots based on hours 9-17, we know:
                // Slot 0 -> 9:00, Slot 1 -> 10:00...

                // Let's rely on string parsing for robustness
                const [time, period] = slot.startTime.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0; // Midnight edge case (unlikely here)

                const slotStartTotalMinutes = hours * 60 + minutes;
                const diff = slotStartTotalMinutes - currentTotalMinutes;

                // Check if upcoming (within 10 mins)
                // e.g., 10:00 start (600 mins). Current 9:51 (591 mins). Diff = 9.
                if (diff > 0 && diff <= 10) {
                    const slotKey = `${slot.startTime}-${slot.day || 'TODAY'}`; // Unique key
                    if (!notifiedSlots.has(slotKey)) {
                        showNotification(diff);
                        notifiedSlots.add(slotKey);
                    }
                }
            }
        });
    }

    function showNotification(minutesLeft) {
        const modal = document.getElementById('free-slot-notification');
        const timeSpan = document.getElementById('notification-time-left');

        if (modal && timeSpan) {
            timeSpan.textContent = `${minutesLeft} mins`;
            modal.classList.remove('hidden');
            // Small delay for transition
            setTimeout(() => {
                modal.classList.remove('translate-y-full', 'opacity-0');
            }, 100);
        }
    }

    function hideNotification() {
        const modal = document.getElementById('free-slot-notification');
        if (modal) {
            modal.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 500); // Wait for transition
        }
    }

    function setupNotificationHandlers() {
        const yesBtn = document.getElementById('notification-yes-btn');
        const noBtn = document.getElementById('notification-no-btn');
        const closeBtn = document.getElementById('notification-close-btn');

        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                hideNotification();
                // Scroll to suggestions
                const suggestions = document.getElementById('suggested-peers-container');
                if (suggestions) {
                    suggestions.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        if (noBtn) {
            noBtn.addEventListener('click', () => {
                hideNotification();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideNotification();
            });
        }
    }

    // Init
    fetchProfile();
    fetchSchedule();
    fetchMatches();
    fetchPeersFreeNow();
    setupNotificationHandlers();

    // Loop
    setInterval(() => {
        updateCurrentStatus();
        checkUpcomingFreeSlots();
    }, 60000); // Every minute

    // Initial calls
    updateCurrentStatus();
    checkUpcomingFreeSlots();
    setInterval(fetchPeersFreeNow, 60000);
});

