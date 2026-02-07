document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'student_login.html';
        return;
    }

    // Fetch User Profile
    async function fetchProfile() {
        try {
            const res = await fetch(`${API_URL}/profile/me`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch profile');

            const profile = await res.json();
            const userName = profile.fullName || profile.userId.name; // Fallback to User model name

            const nameElement = document.getElementById('user-name-display');
            if (nameElement) nameElement.textContent = userName;

            const avatarElement = document.getElementById('user-avatar-display');
            if (avatarElement) avatarElement.textContent = userName.charAt(0).toUpperCase();

        } catch (err) {
            console.error(err);
            // Optionally redirect to login if 401
        }
    }



    // Fetch and Render Today's Schedule
    async function fetchSchedule() {
        try {
            const today = 'MON'; // Hardcoded for demo, can be dynamic
            const res = await fetch(`${API_URL}/timetable/my?day=${today}`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch schedule');

            const schedule = await res.json();

            // 1. Render Current Free Slot (Top Card)
            updateCurrentFreeSlot(schedule);

            // 2. Render Schedule List (Middle Section)
            renderScheduleList(schedule);

        } catch (err) {
            console.error('Error fetching schedule:', err);
        }
    }

    // Helper: Update Top Card "Current Free Slot"
    function updateCurrentFreeSlot(schedule) {
        // Logic: Find the *current* time and see if it falls in a free slot.
        // For demo simplicity, we'll just show the *next* or *current* specific free slot 
        // derived from the schedule gaps, OR use the /free-slots endpoint if easier.
        // Let's use the explicit /free-slots endpoint for the top card as it has logic already.
        fetchFreeSlots();
    }

    async function fetchFreeSlots() {
        try {
            const res = await fetch(`${API_URL}/timetable/free-slots?day=MON`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();

            if (data.freeSlots && data.freeSlots.length > 0) {
                // Determine "Current" free slot based on real time, OR just show the first one for now
                const currentSlot = data.freeSlots[0]; // Simplified for demo

                // Update Main Card
                const timeDisplay = document.querySelector('.bg-gradient-to-r .text-3xl');
                if (timeDisplay) timeDisplay.textContent = `${currentSlot.start} - ${currentSlot.end}`;

                // Update Bubbles
                const bubblesContainer = document.querySelector('.flex.gap-2.text-xs.font-semibold');
                if (bubblesContainer) {
                    bubblesContainer.innerHTML = data.freeSlots.map(slot =>
                        `<span class="bg-white/20 px-3 py-1 rounded-full">${slot.start}</span>`
                    ).join('');
                }
            } else {
                const timeDisplay = document.querySelector('.bg-gradient-to-r .text-3xl');
                if (timeDisplay) timeDisplay.textContent = "Busy All Day";
            }

        } catch (err) {
            console.error(err);
        }
    }

    // Helper: Render Schedule List
    function renderScheduleList(schedule) {
        // We need to merge busy slots (schedule) with free slots to show a complete timeline?
        // The HTML structure separates them. "Today's Schedule" usually implies classes.
        // User asked to "update the schedule". We should list the classes.

        // Find container
        // The HTML has "Today's Schedule" -> "space-y-4" container. 
        // We need to target it specifically. Let's add an ID to the HTML container first.
        // Wait, I can't easily add ID without editing HTML. 
        // I'll search for the h2 "Today's Schedule" and get its parent's sibling container.
        const scheduleHeader = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes("Today's Schedule"));
        if (!scheduleHeader) return;

        const container = scheduleHeader.parentElement.nextElementSibling;
        if (!container) return;

        container.innerHTML = ''; // Clear static content

        if (schedule.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No classes scheduled for today.</p>';
            return;
        }

        schedule.forEach(slot => {
            const item = document.createElement('div');
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
            container.appendChild(item);
        });

        // Optionally insert "Free" blocks? The user requested "update the schedule". 
        // Showing classes is the standard interpretation. Mixing free slots is a bonus feature.
        // The static HTML showed mixed free slots. Let's keep it simple for now: valid classes.
    }


    // Fetch and Render Suggested Peers (Matches)
    async function fetchMatches() {
        try {
            const res = await fetch(`${API_URL}/match`, {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) throw new Error('Failed to fetch matches');

            const matches = await res.json();
            const container = document.getElementById('suggested-peers-container');

            if (container) {
                container.innerHTML = ''; // Clear loading/static content

                if (matches.length === 0) {
                    container.innerHTML = '<p class="text-slate-500 col-span-full text-center">No matches found at the moment. Try updating your interests!</p>';
                    return;
                }

                matches.forEach(match => {
                    const card = document.createElement('div');
                    card.className = 'bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer';

                    // Format common interest (take first one for tag)
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
            const container = document.getElementById('suggested-peers-container');
            if (container) container.innerHTML = '<p class="text-red-400 col-span-full text-center">Error loading suggestions.</p>';
        }
    }

    fetchProfile();
    fetchSchedule(); // This will also call fetchFreeSlots internally
    fetchMatches();

});
