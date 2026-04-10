(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Storage Module
  // ---------------------------------------------------------------------------
  const Storage = {
    get(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        // silently fail
      }
    }
  };

  // Keys
  const KEYS = {
    tasks: 'tld_tasks',
    links: 'tld_links',
    name:  'tld_name'
  };

  // ---------------------------------------------------------------------------
  // Greeting Widget
  // ---------------------------------------------------------------------------
  function formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night';
  }

  const GreetingWidget = {
    init() {
      const timeEl = document.getElementById('greeting-time');
      const dateEl = document.getElementById('greeting-date');
      const msgEl  = document.getElementById('greeting-message');
      const hintEl = document.getElementById('greeting-name-hint');

      let userName = Storage.get(KEYS.name) || '';
      let editing = false;

      function buildGreeting(hour) {
        const base = getGreeting(hour);
        return userName ? `${base}, ${userName}` : base;
      }

      function render() {
        const now = new Date();
        timeEl.textContent = formatTime(now);
        dateEl.textContent = formatDate(now);
        if (!editing) {
          msgEl.textContent = buildGreeting(now.getHours());
        }
      }

      // Click-to-edit the greeting
      msgEl.style.cursor = 'pointer';
      msgEl.title = 'Click to set your name';

      msgEl.addEventListener('click', () => {
        if (msgEl.querySelector('input')) return; // already editing

        const input = document.createElement('input');
        input.type = 'text';
        input.value = userName;
        input.placeholder = 'Your name';
        input.className = 'greeting-name-input';
        input.setAttribute('aria-label', 'Enter your name');

        editing = true;
        msgEl.textContent = '';
        msgEl.appendChild(input);
        if (hintEl) hintEl.style.display = 'none';
        input.focus();
        input.select();

        let committed = false;
        const commit = () => {
          if (committed) return;
          committed = true;
          clearTimeout(timeoutId);
          editing = false;
          userName = input.value.trim();
          Storage.set(KEYS.name, userName);
          render();
          if (hintEl) hintEl.style.display = userName ? 'none' : '';
        };

        // Auto-commit after 3 seconds of inactivity
        let timeoutId = setTimeout(() => input.blur(), 3000);
        input.addEventListener('input', () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => input.blur(), 3000);
        });

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
          if (e.key === 'Escape') { input.value = userName; input.blur(); }
        });
      });

      // Hide hint if name already set
      if (hintEl && userName) hintEl.style.display = 'none';

      render();
      setInterval(render, 1000);
    }
  };

  // ---------------------------------------------------------------------------
  // Timer Widget
  // ---------------------------------------------------------------------------
  const TimerWidget = {
    state: { remaining: 1500, running: false, intervalId: null },

    init() {
      const display   = document.getElementById('timer-display');
      const btnStart  = document.getElementById('timer-start');
      const btnStop   = document.getElementById('timer-stop');
      const btnReset  = document.getElementById('timer-reset');
      const btnMinus  = document.getElementById('timer-minus');
      const btnPlus   = document.getElementById('timer-plus');

      const updateDisplay = () => {
        const m = String(Math.floor(this.state.remaining / 60)).padStart(2, '0');
        const s = String(this.state.remaining % 60).padStart(2, '0');
        display.textContent = `${m}:${s}`;
      };

      const adjustMinutes = (delta) => {
        if (this.state.running) return;
        const newVal = this.state.remaining + delta * 60;
        this.state.remaining = Math.min(Math.max(newVal, 60), 99 * 60);
        updateDisplay();
      };

      const setPreset = (seconds) => {
        if (this.state.running) return;
        stop();
        this.state.remaining = seconds;
        updateDisplay();
        document.querySelectorAll('.timer-preset').forEach(btn => {
          btn.classList.toggle('active', Number(btn.dataset.seconds) === seconds);
        });
      };

      document.querySelectorAll('.timer-preset').forEach(btn => {
        btn.addEventListener('click', () => setPreset(Number(btn.dataset.seconds)));
      });

      const notify = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Focus session complete!', { body: 'Time to take a break.' });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Focus session complete!', { body: 'Time to take a break.' });
            } else {
              alert('Focus session complete! Time to take a break.');
            }
          });
        } else {
          alert('Focus session complete! Time to take a break.');
        }
      };

      const stop = () => {
        clearInterval(this.state.intervalId);
        this.state.intervalId = null;
        this.state.running = false;
      };

      const reset = () => {
        stop();
        this.state.remaining = 1500;
        updateDisplay();
      };

      const start = () => {
        if (this.state.running) return;
        this.state.running = true;
        this.state.intervalId = setInterval(() => {
          this.state.remaining -= 1;
          updateDisplay();
          if (this.state.remaining === 0) {
            stop();
            notify();
          }
        }, 1000);
      };

      btnStart.addEventListener('click', start);
      btnStop.addEventListener('click', stop);
      btnReset.addEventListener('click', reset);
      btnMinus.addEventListener('click', () => adjustMinutes(-1));
      btnPlus.addEventListener('click',  () => adjustMinutes(+1));

      updateDisplay();
    }
  };

  // ---------------------------------------------------------------------------
  // Todo Widget
  // ---------------------------------------------------------------------------
  const TodoWidget = {
    tasks: [],

    init() {
      this.tasks = Storage.get(KEYS.tasks) || [];
      this.renderAll();

      const form    = document.getElementById('todo-form');
      const input   = document.getElementById('todo-input');
      const errorEl = document.getElementById('todo-error');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = this.addTask(input.value);
        if (err) {
          errorEl.textContent = err;
        } else {
          errorEl.textContent = '';
          input.value = '';
        }
      });
    },

    // Returns an error string on failure, null on success
    addTask(description) {
      const trimmed = (description || '').trim();
      if (!trimmed) {
        return 'Task description cannot be empty.';
      }
      const isDuplicate = this.tasks.some(
        t => t.description.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return 'This task already exists.';
      }
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now()) + String(Math.random());
      const task = { id, description: trimmed, completed: false };
      this.tasks.push(task);
      Storage.set(KEYS.tasks, this.tasks);
      this._renderItem(task);
      return null;
    },

    editTask(id, newDescription) {
      const trimmed = (newDescription || '').trim();
      if (!trimmed) return false;
      const task = this.tasks.find(t => t.id === id);
      if (!task) return false;
      task.description = trimmed;
      Storage.set(KEYS.tasks, this.tasks);
      return true;
    },

    toggleTask(id) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = !task.completed;
      Storage.set(KEYS.tasks, this.tasks);
      const li = document.querySelector(`[data-id="${id}"]`);
      if (li) {
        li.classList.toggle('completed', task.completed);
        const cb = li.querySelector('.todo-toggle');
        if (cb) cb.checked = task.completed;
      }
    },

    deleteTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      Storage.set(KEYS.tasks, this.tasks);
      const li = document.querySelector(`[data-id="${id}"]`);
      if (li) li.remove();
    },

    renderAll() {
      const list = document.getElementById('todo-list');
      list.innerHTML = '';
      this.tasks.forEach(task => this._renderItem(task));
    },

    _renderItem(task) {
      const list = document.getElementById('todo-list');
      const li = document.createElement('li');
      li.dataset.id = task.id;
      li.draggable = true;
      if (task.completed) li.classList.add('completed');

      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'todo-drag-handle';
      handle.textContent = '⠿';
      handle.setAttribute('aria-hidden', 'true');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'todo-toggle';
      cb.checked = task.completed;
      cb.setAttribute('aria-label', 'Mark complete');
      cb.addEventListener('change', () => this.toggleTask(task.id));

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = task.description;

      const editBtn = document.createElement('button');
      editBtn.className = 'todo-edit';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => this._startEdit(task.id, li, span));

      const delBtn = document.createElement('button');
      delBtn.className = 'todo-delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => this.deleteTask(task.id));

      li.append(handle, cb, span, editBtn, delBtn);
      this._attachDragEvents(li);
      list.appendChild(li);
    },

    _attachDragEvents(li) {
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', li.dataset.id);
        li.classList.add('dragging');
      });

      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('#todo-list li').forEach(el => el.classList.remove('drag-over'));
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('#todo-list li').forEach(el => el.classList.remove('drag-over'));
        li.classList.add('drag-over');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === li.dataset.id) return;

        const fromIndex = this.tasks.findIndex(t => t.id === draggedId);
        const toIndex   = this.tasks.findIndex(t => t.id === li.dataset.id);
        if (fromIndex === -1 || toIndex === -1) return;

        // Reorder in-memory array
        const [moved] = this.tasks.splice(fromIndex, 1);
        this.tasks.splice(toIndex, 0, moved);
        Storage.set(KEYS.tasks, this.tasks);

        // Re-render to reflect new order
        this.renderAll();
      });
    },

    _startEdit(id, li, span) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;

      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'todo-edit-input';
      editInput.value = task.description;

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'todo-confirm';
      confirmBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'todo-cancel';
      cancelBtn.textContent = 'Cancel';

      const editError = document.createElement('span');
      editError.className = 'error';

      // Hide original controls
      const editBtn = li.querySelector('.todo-edit');
      const delBtn  = li.querySelector('.todo-delete');
      span.style.display = 'none';
      editBtn.style.display = 'none';

      li.insertBefore(editInput, editBtn);
      li.insertBefore(confirmBtn, editBtn);
      li.insertBefore(cancelBtn, editBtn);
      li.insertBefore(editError, editBtn);

      const cleanup = () => {
        editInput.remove();
        confirmBtn.remove();
        cancelBtn.remove();
        editError.remove();
        span.style.display = '';
        editBtn.style.display = '';
      };

      confirmBtn.addEventListener('click', () => {
        const ok = this.editTask(id, editInput.value);
        if (!ok) {
          editError.textContent = 'Description cannot be empty.';
          return;
        }
        span.textContent = task.description;
        cleanup();
      });

      cancelBtn.addEventListener('click', cleanup);

      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
      });

      editInput.focus();
    }
  };

  // ---------------------------------------------------------------------------
  // Links Widget
  // ---------------------------------------------------------------------------
  const LinksWidget = {
    links: [],

    init() {
      this.links = Storage.get(KEYS.links) || [];
      this.renderAll();

      const form    = document.getElementById('links-form');
      const labelEl = document.getElementById('links-label');
      const urlEl   = document.getElementById('links-url');
      const errorEl = document.getElementById('links-error');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = this.addLink(labelEl.value, urlEl.value);
        if (err) {
          errorEl.textContent = err;
        } else {
          errorEl.textContent = '';
          labelEl.value = '';
          urlEl.value = '';
        }
      });
    },

    // Returns an error string on failure, null on success
    addLink(label, url) {
      const trimmedLabel = (label || '').trim();
      if (!trimmedLabel) {
        return 'Label cannot be empty.';
      }
      try {
        new URL(url);
      } catch (e) {
        return 'Please enter a valid URL (e.g. https://example.com).';
      }
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now()) + String(Math.random());
      const link = { id, label: trimmedLabel, url };
      this.links.push(link);
      Storage.set(KEYS.links, this.links);
      this._renderItem(link);
      return null;
    },

    deleteLink(id) {
      this.links = this.links.filter(l => l.id !== id);
      Storage.set(KEYS.links, this.links);
      const item = document.querySelector(`[data-link-id="${id}"]`);
      if (item) item.remove();
    },

    renderAll() {
      const list = document.getElementById('links-list');
      list.innerHTML = '';
      this.links.forEach(link => this._renderItem(link));
    },

    _renderItem(link) {
      const list = document.getElementById('links-list');
      const div = document.createElement('div');
      div.className = 'link-item';
      div.dataset.linkId = link.id;

      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-btn';
      anchor.textContent = link.label;

      const delBtn = document.createElement('button');
      delBtn.className = 'link-delete';
      delBtn.textContent = 'Delete';
      delBtn.setAttribute('aria-label', `Delete ${link.label}`);
      delBtn.addEventListener('click', () => this.deleteLink(link.id));

      div.append(anchor, delBtn);
      list.appendChild(div);
    }
  };

  // ---------------------------------------------------------------------------
  // Theme Toggle
  // ---------------------------------------------------------------------------
  const ThemeToggle = {
    KEY: 'tld_theme',
    init() {
      const btn = document.getElementById('theme-toggle');
      const saved = Storage.get(this.KEY);
      if (saved === 'dark') this._apply('dark');

      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        this._apply(next);
        Storage.set(this.KEY, next);
      });
    },
    _apply(theme) {
      const btn = document.getElementById('theme-toggle');
      if (theme === 'dark') {
        document.documentElement.dataset.theme = 'dark';
        btn.textContent = '☀️';
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        delete document.documentElement.dataset.theme;
        btn.textContent = '🌙';
        btn.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // App entry point
  // ---------------------------------------------------------------------------
  function init() {
    ThemeToggle.init();
    GreetingWidget.init();
    TimerWidget.init();
    TodoWidget.init();
    LinksWidget.init();
  }

  document.addEventListener('DOMContentLoaded', init);
}());
