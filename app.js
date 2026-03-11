(function () {
    const STORAGE_KEY = 'sales-tracker';

    // --- Data ---

    function getTodayStr() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function getData() {
        const data = loadData();
        const today = getTodayStr();
        if (data && data.date === today) return data;
        // New day — reset
        const fresh = { date: today, activities: [] };
        saveData(fresh);
        return fresh;
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function addActivity(type) {
        const data = getData();
        const now = new Date();
        const time = String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        data.activities.push({ time, type });
        saveData(data);
        updateUI();
    }

    // --- UI Updates ---

    function updateMetrics() {
        const data = getData();
        const counts = { 'Samtale': 0, 'Oppfølging': 0, 'Møte i kalender': 0 };
        data.activities.forEach(a => {
            if (counts.hasOwnProperty(a.type)) counts[a.type]++;
        });
        document.getElementById('metric-samtale').textContent = counts['Samtale'];
        document.getElementById('metric-oppfolging').textContent = counts['Oppfølging'];
        document.getElementById('metric-mote').textContent = counts['Møte i kalender'];
    }

    function updateHourHeader() {
        const now = new Date();
        const h = now.getHours();
        const from = String(h).padStart(2, '0') + ':00';
        const to = String(h + 1).padStart(2, '0') + ':00';
        document.getElementById('hour-header').textContent = from + ' – ' + to;
    }

    function getTypeClass(type) {
        if (type === 'Ringt') return 'type-ringt';
        if (type === 'Samtale') return 'type-samtale';
        if (type === 'Oppfølging') return 'type-oppfolging';
        if (type === 'Møte i kalender') return 'type-mote';
        return '';
    }

    function updateActivityLog() {
        const data = getData();
        const currentHour = new Date().getHours();
        const hourPrefix = String(currentHour).padStart(2, '0') + ':';

        const filtered = data.activities.filter(a => a.time.startsWith(hourPrefix));
        const log = document.getElementById('activity-log');

        if (filtered.length === 0) {
            log.innerHTML = '<p class="empty-state">Ingen aktiviteter denne timen</p>';
            return;
        }

        log.innerHTML = filtered.map(a =>
            '<div class="activity-item">' +
            '<span class="activity-time">' + a.time + '</span>' +
            '<span class="activity-type ' + getTypeClass(a.type) + '">' + a.type + '</span>' +
            '</div>'
        ).join('');
    }

    function updateUI() {
        updateMetrics();
        updateHourHeader();
        updateActivityLog();
    }

    // --- Timer ---

    function updateTimer() {
        const now = new Date();
        const minutesInHour = now.getMinutes();
        const secondsInMinute = now.getSeconds();
        const timerBar = document.querySelector('.timer-bar');
        const label = document.getElementById('timer-label');
        const countdown = document.getElementById('timer-countdown');

        if (minutesInHour < 45) {
            // Work period: count down from 45 min
            const remaining = (44 - minutesInHour) * 60 + (60 - secondsInMinute);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            countdown.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            label.textContent = 'Arbeidstid';
            timerBar.classList.remove('pause');
        } else {
            // Break period: count down from 15 min
            const remaining = (59 - minutesInHour) * 60 + (60 - secondsInMinute);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            countdown.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            label.textContent = 'Pause';
            timerBar.classList.add('pause');
        }
    }

    // --- Init ---

    // Button handlers
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => addActivity(btn.dataset.type));
    });

    // Initial render
    updateUI();
    updateTimer();

    // Timer: every second
    setInterval(updateTimer, 1000);

    // Activity log + header: every minute (catches hour changes)
    let lastHour = new Date().getHours();
    setInterval(() => {
        const currentHour = new Date().getHours();
        if (currentHour !== lastHour) {
            lastHour = currentHour;
            updateUI();
        }
    }, 10000);
})();
