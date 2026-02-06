  /* ==================================================================
       DARK / LIGHT MODE
       ================================================================== */
    (function initTheme() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (e.matches) {
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
        }
      });
    })();

    /* ==================================================================
       STATE
       ================================================================== */
    var currentUser = null;
    var authMode = 'login';
    var classes = [];
    var editingClassId = null;
    var deleteClassId = null;

    /* Sample data with matric numbers and confidence scores */
    var sampleClasses = [
      {
        id: '1',
        name: 'Introduction to Programming',
        date: '2025-02-10',
        time: '09:00',
        duration: 90,
        location: 'Room 101, Building A',
        students: [
          { id: 'S001', matric: 'U2021/CSC/001', name: 'Alice Johnson', status: 'present', confidence: 98 },
          { id: 'S002', matric: 'U2021/CSC/002', name: 'Bob Smith', status: 'present', confidence: 95 },
          { id: 'S003', matric: 'U2021/CSC/003', name: 'Carol White', status: 'absent', confidence: 0 },
          { id: 'S004', matric: 'U2021/CSC/004', name: 'David Brown', status: 'present', confidence: 91 },
          { id: 'S005', matric: 'U2021/CSC/005', name: 'Eva Martinez', status: 'present', confidence: 97 }
        ]
      },
      {
        id: '2',
        name: 'Data Structures & Algorithms',
        date: '2025-02-11',
        time: '14:00',
        duration: 120,
        location: 'Room 203, Building B',
        students: [
          { id: 'S001', matric: 'U2021/CSC/001', name: 'Alice Johnson', status: 'present', confidence: 99 },
          { id: 'S002', matric: 'U2021/CSC/002', name: 'Bob Smith', status: 'absent', confidence: 0 },
          { id: 'S003', matric: 'U2021/CSC/003', name: 'Carol White', status: 'present', confidence: 88 },
          { id: 'S006', matric: 'U2021/CSC/006', name: 'Frank Okafor', status: 'present', confidence: 96 },
          { id: 'S007', matric: 'U2021/CSC/007', name: 'Grace Lee', status: 'present', confidence: 93 },
          { id: 'S008', matric: 'U2021/CSC/008', name: 'Henry Adamu', status: 'present', confidence: 78 }
        ]
      },
      {
        id: '3',
        name: 'Web Development',
        date: '2025-02-12',
        time: '11:00',
        duration: 60,
        location: 'Lab 5, Tech Centre',
        students: [
          { id: 'S001', matric: 'U2021/CSC/001', name: 'Alice Johnson', status: 'present', confidence: 97 },
          { id: 'S004', matric: 'U2021/CSC/004', name: 'David Brown', status: 'present', confidence: 94 },
          { id: 'S009', matric: 'U2021/CSC/009', name: 'Ify Nwosu', status: 'absent', confidence: 0 },
          { id: 'S010', matric: 'U2021/CSC/010', name: 'James Obi', status: 'present', confidence: 85 }
        ]
      }
    ];

    /* ==================================================================
       INIT
       ================================================================== */
    document.addEventListener('DOMContentLoaded', function() {
      setupAuthTabs();
      setupForms();
      classes = sampleClasses.map(function(c) { return Object.assign({}, c); });
    });

    /* ==================================================================
       AUTH
       ================================================================== */
    function setupAuthTabs() {
      var tabs = document.querySelectorAll('.auth-tab');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          setAuthMode(tab.dataset.tab);
        });
      });
    }

    function setAuthMode(mode) {
      authMode = mode;
      document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelector('[data-tab="' + mode + '"]').classList.add('active');

      var confirmGroup = document.getElementById('confirmPasswordGroup');
      var nameGroup = document.getElementById('nameGroup');
      var forgotLink = document.getElementById('forgotPasswordLink');
      var submitBtn = document.getElementById('authSubmitBtn');

      if (mode === 'signup') {
        confirmGroup.style.display = 'block';
        nameGroup.style.display = 'block';
        forgotLink.style.display = 'none';
        submitBtn.textContent = 'Create Account';
      } else {
        confirmGroup.style.display = 'none';
        nameGroup.style.display = 'none';
        forgotLink.style.display = 'block';
        submitBtn.textContent = 'Login';
      }
      clearErrors();
    }

    function setupForms() {
      document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
      document.getElementById('classForm').addEventListener('submit', handleClassSubmit);
      document.getElementById('forgotForm').addEventListener('submit', handleForgotSubmit);
      document.getElementById('forgotPasswordLink').addEventListener('click', openForgotModal);
    }

    function handleAuthSubmit(e) {
      e.preventDefault();
      clearErrors();

      var email = document.getElementById('emailInput').value.trim();
      var password = document.getElementById('passwordInput').value;

      if (!validateEmail(email)) { showError('emailError', 'Please enter a valid email'); return; }
      if (password.length < 6) { showError('passwordError', 'Password must be at least 6 characters'); return; }

      if (authMode === 'signup') {
        var confirmPw = document.getElementById('confirmPasswordInput').value;
        var name = document.getElementById('nameInput').value.trim();
        if (password !== confirmPw) { showError('confirmPasswordError', 'Passwords do not match'); return; }
        if (!name) { showError('nameError', 'Please enter your full name'); return; }
        currentUser = { email: email, name: name };
        showToast('Account created — welcome to Timely!', 'success');
      } else {
        currentUser = { email: email, name: 'Dr. ' + email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }) };
        showToast('Face Identity Verified — login successful', 'success');
      }
      showDashboard();
    }

    /* ==================================================================
       DASHBOARD
       ================================================================== */
    function showDashboard() {
      document.getElementById('authScreen').classList.remove('active');
      var dash = document.getElementById('dashboardScreen');
      dash.classList.add('active');
      document.getElementById('lecturerName').textContent = currentUser.name;
      document.getElementById('profileName').textContent = currentUser.name;
      document.getElementById('profileEmail').textContent = currentUser.email;
      renderClasses();
      renderAttendance();
      updateStats();
    }

    function handleLogout() {
      currentUser = null;
      closeProfileDropdown();
      document.getElementById('dashboardScreen').classList.remove('active');
      document.getElementById('authScreen').classList.add('active');
      document.getElementById('authForm').reset();
      showToast('Signed out successfully', 'success');
    }

    /* ==================================================================
       PROFILE DROPDOWN
       ================================================================== */
    function toggleProfileDropdown() {
      var dd = document.getElementById('profileDropdown');
      dd.classList.toggle('open');
    }
    function closeProfileDropdown() {
      document.getElementById('profileDropdown').classList.remove('open');
    }
    document.addEventListener('click', function(e) {
      var btn = document.getElementById('profileBtn');
      var dd = document.getElementById('profileDropdown');
      if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
        closeProfileDropdown();
      }
    });

    /* ==================================================================
       RENDER CLASSES
       ================================================================== */
    function renderClasses() {
      var container = document.getElementById('classList');
      if (classes.length === 0) {
        container.innerHTML = '<div class="empty-list"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><p>No upcoming classes yet</p></div>';
        return;
      }
      container.innerHTML = classes.map(function(cls) {
        return '<div class="class-item" onclick="viewAttendanceDetails(\'' + cls.id + '\')">' +
          '<div class="class-item-header">' +
            '<span class="class-item-name">' + escapeHtml(cls.name) + '</span>' +
            '<div class="class-item-actions">' +
              '<button class="action-btn edit-btn" onclick="event.stopPropagation(); editClass(\'' + cls.id + '\')" aria-label="Edit">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              '</button>' +
              '<button class="action-btn delete-btn" onclick="event.stopPropagation(); confirmDelete(\'' + cls.id + '\')" aria-label="Delete">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="class-item-meta">' +
            '<div class="meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + formatDate(cls.date) + '</div>' +
            '<div class="meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + formatTime(cls.time) + ' (' + cls.duration + ' min)</div>' +
            '<div class="meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + escapeHtml(cls.location) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    /* ==================================================================
       RENDER ATTENDANCE
       ================================================================== */
    function renderAttendance() {
      var container = document.getElementById('attendanceList');
      if (classes.length === 0) {
        container.innerHTML = '<div class="empty-list"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>No attendance records yet</p></div>';
        return;
      }
      container.innerHTML = classes.map(function(cls) {
        var present = cls.students.filter(function(s) { return s.status === 'present'; }).length;
        var absent = cls.students.filter(function(s) { return s.status === 'absent'; }).length;
        var total = cls.students.length;
        var pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return '<div class="attendance-card" onclick="viewAttendanceDetails(\'' + cls.id + '\')">' +
          '<div class="attendance-header">' +
            '<span class="attendance-class-name">' + escapeHtml(cls.name) + '</span>' +
            '<button class="view-details-btn" onclick="event.stopPropagation(); viewAttendanceDetails(\'' + cls.id + '\')">View Details</button>' +
          '</div>' +
          '<div class="attendance-stats">' +
            '<div class="attendance-stat"><span class="stat-dot present"></span><span>Present: ' + present + '</span></div>' +
            '<div class="attendance-stat"><span class="stat-dot absent"></span><span>Absent: ' + absent + '</span></div>' +
          '</div>' +
          '<div class="att-progress"><div class="att-bar-bg"><div class="att-bar-fill" style="width: ' + pct + '%"></div></div></div>' +
        '</div>';
      }).join('');
    }

    /* ==================================================================
       STATS
       ================================================================== */
    function updateStats() {
      var totalClassesEl = document.getElementById('totalClasses');
      var totalStudentsEl = document.getElementById('totalStudents');
      var avgAttendanceEl = document.getElementById('avgAttendance');

      var uniqueStudents = {};
      var totalPresent = 0;
      var totalRecords = 0;

      classes.forEach(function(cls) {
        cls.students.forEach(function(s) {
          uniqueStudents[s.id] = true;
          totalRecords++;
          if (s.status === 'present') totalPresent++;
        });
      });

      var avg = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      animateCounter(totalClassesEl, classes.length);
      animateCounter(totalStudentsEl, Object.keys(uniqueStudents).length);
      animateCounter(avgAttendanceEl, avg, '%');
    }

    function animateCounter(el, target, suffix) {
      suffix = suffix || '';
      var start = parseInt(el.textContent) || 0;
      if (start === target) { el.textContent = target + suffix; return; }
      var duration = 600;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(start + (target - start) * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    /* ==================================================================
       CLASS MODAL
       ================================================================== */
    function openClassModal() {
      editingClassId = null;
      document.getElementById('classModalTitle').textContent = 'Add New Class';
      document.getElementById('classForm').reset();
      document.getElementById('classId').value = '';
      document.getElementById('classDateInput').value = new Date().toISOString().split('T')[0];
      document.getElementById('classModal').classList.add('active');
    }

    function editClass(id) {
      var cls = classes.find(function(c) { return c.id === id; });
      if (!cls) return;
      editingClassId = id;
      document.getElementById('classModalTitle').textContent = 'Edit Class';
      document.getElementById('classId').value = id;
      document.getElementById('classNameInput').value = cls.name;
      document.getElementById('classDateInput').value = cls.date;
      document.getElementById('classTimeInput').value = cls.time;
      document.getElementById('classDurationInput').value = cls.duration;
      document.getElementById('classLocationInput').value = cls.location;
      document.getElementById('classModal').classList.add('active');
    }

    function closeClassModal() {
      document.getElementById('classModal').classList.remove('active');
      editingClassId = null;
    }

    function handleClassSubmit(e) {
      e.preventDefault();
      var classData = {
        id: editingClassId || Date.now().toString(),
        name: document.getElementById('classNameInput').value.trim(),
        date: document.getElementById('classDateInput').value,
        time: document.getElementById('classTimeInput').value,
        duration: parseInt(document.getElementById('classDurationInput').value),
        location: document.getElementById('classLocationInput').value.trim(),
        students: []
      };

      if (editingClassId) {
        var existing = classes.find(function(c) { return c.id === editingClassId; });
        if (existing) classData.students = existing.students;
        var idx = classes.findIndex(function(c) { return c.id === editingClassId; });
        if (idx !== -1) classes[idx] = classData;
        showToast('Class updated successfully!', 'success');
      } else {
        classes.push(classData);
        showToast('Class added successfully!', 'success');
      }

      closeClassModal();
      renderClasses();
      renderAttendance();
      updateStats();
    }

    /* ==================================================================
       DELETE CONFIRMATION
       ================================================================== */
    function confirmDelete(id) {
      deleteClassId = id;
      var cls = classes.find(function(c) { return c.id === id; });
      if (cls) {
        document.getElementById('confirmMessage').textContent =
          'Are you sure you want to delete "' + cls.name + '"? This action cannot be undone.';
      }
      document.getElementById('confirmModal').classList.add('active');
      document.getElementById('confirmDeleteBtn').onclick = function() {
        deleteClass(deleteClassId);
        closeConfirmModal();
      };
    }

    function closeConfirmModal() {
      document.getElementById('confirmModal').classList.remove('active');
      deleteClassId = null;
    }

    function deleteClass(id) {
      classes = classes.filter(function(c) { return c.id !== id; });
      renderClasses();
      renderAttendance();
      updateStats();
      showToast('Class deleted', 'success');
    }

    /* ==================================================================
       ATTENDANCE DETAILS (VERIFICATION MODAL)
       ================================================================== */
    function viewAttendanceDetails(id) {
      var cls = classes.find(function(c) { return c.id === id; });
      if (!cls) return;

      document.getElementById('attendanceModalTitle').textContent = cls.name + ' — Verification';

      if (cls.students.length === 0) {
        document.getElementById('studentList').innerHTML =
          '<p style="text-align:center;color:var(--text-muted);padding:24px;">No student records for this class</p>';
      } else {
        document.getElementById('studentList').innerHTML = cls.students.map(function(s) {
          var confClass = s.confidence >= 90 ? 'high' : (s.confidence >= 75 ? 'medium' : 'low');
          var confText = s.status === 'present' ? (s.confidence + '% Match') : 'No Scan';
          var confDisplay = s.status === 'present'
            ? '<div class="confidence-score ' + confClass + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                confText +
              '</div>'
            : '<div class="confidence-score low">' + confText + '</div>';

          return '<div class="student-item">' +
            '<div class="student-info">' +
              '<div class="student-avatar">' + getInitials(s.name) + '</div>' +
              '<div>' +
                '<div class="student-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="student-id">' + escapeHtml(s.matric || s.id) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="student-right">' +
              confDisplay +
              '<span class="status-badge ' + s.status + '">' + s.status + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      document.getElementById('attendanceModal').classList.add('active');
    }

    function closeAttendanceModal() {
      document.getElementById('attendanceModal').classList.remove('active');
    }

    /* ==================================================================
       FORGOT PASSWORD
       ================================================================== */
    function openForgotModal() {
      document.getElementById('forgotModal').classList.add('active');
    }

    function closeForgotModal() {
      document.getElementById('forgotModal').classList.remove('active');
      document.getElementById('forgotForm').reset();
    }

    function handleForgotSubmit(e) {
      e.preventDefault();
      var email = document.getElementById('forgotEmailInput').value.trim();
      if (!validateEmail(email)) { showToast('Please enter a valid email', 'error'); return; }
      showToast('Password reset link sent to your email', 'success');
      closeForgotModal();
    }

    /* ==================================================================
       TOAST SYSTEM
       ================================================================== */
    function showToast(message, type) {
      type = type || 'success';
      var container = document.getElementById('toastContainer');
      var toast = document.createElement('div');
      toast.className = 'toast ' + type;

      var iconPath = type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
        : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

      toast.innerHTML =
        '<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">' + iconPath + '</svg>' +
        '<span class="toast-message">' + escapeHtml(message) + '</span>';

      container.appendChild(toast);

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          toast.classList.add('show');
        });
      });

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 400);
      }, 3200);
    }

    /* ==================================================================
       UTILITIES
       ================================================================== */
    function togglePassword(inputId, btn) {
      var input = document.getElementById(inputId);
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
    }

    function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    function showError(id, msg) {
      var el = document.getElementById(id);
      el.textContent = msg;
      el.classList.add('visible');
    }

    function clearErrors() {
      document.querySelectorAll('.form-error').forEach(function(el) {
        el.textContent = '';
        el.classList.remove('visible');
      });
    }

    function formatDate(dateStr) {
      var d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function formatTime(timeStr) {
      var parts = timeStr.split(':');
      var h = parseInt(parts[0]);
      var ampm = h >= 12 ? 'PM' : 'AM';
      return (h % 12 || 12) + ':' + parts[1] + ' ' + ampm;
    }

    function getInitials(name) {
      return name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
    }

    function escapeHtml(text) {
      var d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    }

    /* Close modals on overlay click */
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
 