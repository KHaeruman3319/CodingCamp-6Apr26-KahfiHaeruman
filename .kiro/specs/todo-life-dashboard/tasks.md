# Implementation Plan: To-Do Life Dashboard

## Overview

Build a single-page productivity dashboard using plain HTML, CSS, and vanilla JavaScript. The app is structured as `index.html` + `css/style.css` + `js/app.js`, with all state persisted in `localStorage`. No frameworks, no build tools, no backend.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with semantic layout sections for each widget: greeting, timer, todo list, and quick links
  - Create `css/style.css` with a minimal reset and base layout (grid or flexbox)
  - Create `js/app.js` wrapped in an IIFE, with a `DOMContentLoaded` listener calling `init()`
  - _Requirements: 10.1, 10.3_

- [x] 2. Implement the Storage module
  - [x] 2.1 Write the `Storage` module inside `app.js`
    - Implement `Storage.get(key)` — wraps `localStorage.getItem` + `JSON.parse` in `try/catch`, returns parsed value or `null` on any error
    - Implement `Storage.set(key, value)` — wraps `JSON.stringify` + `localStorage.setItem` in `try/catch`, silently fails on error
    - Use keys `"tld_tasks"` and `"tld_links"`
    - _Requirements: 7.2, 8.7, 9.1, 9.2_

- [x] 3. Implement the Greeting Widget
  - [x] 3.1 Implement `GreetingWidget.init()` in `app.js`
    - Extract pure helper functions: `formatTime(date)` → `"HH:MM:SS"`, `formatDate(date)` → human-readable string, `getGreeting(hour)` → greeting string
    - Wire helpers to DOM text nodes; start a `setInterval` at 1000 ms that calls all three on each tick and updates the DOM immediately on init
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 3.2 Write property test for `formatTime` (Property 1)
    - **Property 1: Time format is always HH:MM:SS**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for `formatDate` (Property 2)
    - **Property 2: Date format always contains weekday, month, day, and year**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for `getGreeting` (Property 3)
    - **Property 3: Greeting maps correctly to all 24 hours**
    - **Validates: Requirements 1.3**

- [x] 4. Implement the Timer Widget
  - [x] 4.1 Implement `TimerWidget.init()` in `app.js`
    - Manage state `{ remaining: 1500, running: false, intervalId: null }`
    - Implement `start()`, `stop()`, `reset()` as pure state-mutating functions that also update the display
    - Wire Start, Stop, Reset buttons to their handlers
    - On `remaining === 0`: clear interval, set `running = false`, attempt `Notification` API with permission check, fall back to `alert()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Write property test for timer decrement (Property 4)
    - **Property 4: Timer decrement reduces remaining by exactly one**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 4.3 Write property test for stop (Property 5)
    - **Property 5: Stop preserves remaining time**
    - **Validates: Requirements 2.4**

  - [ ]* 4.4 Write property test for reset (Property 6)
    - **Property 6: Reset always produces the initial state**
    - **Validates: Requirements 2.5**

- [ ] 5. Checkpoint — Ensure greeting and timer work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the Todo Widget — core CRUD
  - [x] 6.1 Implement `TodoWidget.init()` with `addTask`, `renderAll`, and DOM wiring
    - On init, call `Storage.get("tld_tasks")` and `renderAll()` (empty array if null)
    - `addTask(description)`: trim input, reject empty/whitespace with inline error `<span class="error">`, generate ID via `crypto.randomUUID()` (fallback: `Date.now() + Math.random()`), push to in-memory array, call `Storage.set`, render new item
    - Wire the add form submit event (also handle Enter key)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3_

  - [ ]* 6.2 Write property test for `addTask` valid input (Property 7)
    - **Property 7: Adding a valid task grows the list by one**
    - **Validates: Requirements 3.2**

  - [ ]* 6.3 Write property test for whitespace rejection (Property 8)
    - **Property 8: Whitespace-only input is always rejected**
    - **Validates: Requirements 3.3, 4.4**

  - [x] 6.4 Implement `editTask(id, newDescription)` and `toggleTask(id)`
    - `editTask`: replace task's display text with a pre-filled `<input>`, confirm replaces description (trim + reject empty), cancel restores display; persist on confirm
    - `toggleTask`: flip `completed` boolean, toggle CSS class for strikethrough, persist
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.5 Write property test for edit pre-fill and update (Property 10)
    - **Property 10: Edit pre-fills with current description and updates on confirm**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 6.6 Write property test for completion toggle round-trip (Property 11)
    - **Property 11: Completion toggle is a round-trip**
    - **Validates: Requirements 5.2, 5.3**

  - [x] 6.7 Implement `deleteTask(id)`
    - Remove task from in-memory array, remove its DOM node, persist
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.8 Write property test for delete (Property 12)
    - **Property 12: Deleting a task removes it from the list**
    - **Validates: Requirements 6.2**

  - [ ]* 6.9 Write property test for localStorage round-trip (Property 9)
    - **Property 9: Task list state is always reflected in localStorage**
    - **Validates: Requirements 3.4, 4.5, 5.4, 6.3, 7.1, 7.2**

- [ ] 7. Checkpoint — Ensure todo CRUD works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement the Links Widget
  - [x] 8.1 Implement `LinksWidget.init()` with `addLink`, `deleteLink`, and `renderAll`
    - On init, call `Storage.get("tld_links")` and `renderAll()` (empty array if null)
    - `addLink(label, url)`: trim label (reject empty), validate URL via `new URL(url)` in `try/catch` (reject on throw), generate ID, push to array, persist, render as `<a target="_blank">` button
    - `deleteLink(id)`: remove from array, remove DOM node, persist
    - Wire the add form submit event
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 8.2 Write property test for `addLink` valid input (Property 13)
    - **Property 13: Adding a valid link grows the link list by one**
    - **Validates: Requirements 8.2**

  - [ ]* 8.3 Write property test for invalid link rejection (Property 14)
    - **Property 14: Invalid link input is always rejected**
    - **Validates: Requirements 8.3**

  - [ ]* 8.4 Write property test for delete link (Property 15)
    - **Property 15: Deleting a link removes it from the list**
    - **Validates: Requirements 8.6**

  - [ ]* 8.5 Write property test for link localStorage round-trip (Property 16)
    - **Property 16: Link list state is always reflected in localStorage**
    - **Validates: Requirements 8.7, 8.8**

- [x] 9. Style the dashboard
  - Add layout, typography, and widget styles to `css/style.css`
  - Apply strikethrough style for completed tasks (`.completed` class)
  - Ensure inline error messages are visually distinct (`.error` class)
  - Ensure the layout is clean and readable on a standard desktop viewport
  - _Requirements: 5.2, 10.1, 10.2_

- [ ] 10. Final checkpoint — Wire everything together and verify
  - Confirm `init()` calls all four widget `init()` functions in `DOMContentLoaded`
  - Verify `localStorage` persistence survives a page reload for tasks and links
  - Verify the timer resets to 25:00 on reload (intentional, not persisted)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- No test framework setup is required (NFR-1); property tests use fast-check with jsdom if opted in
- Each task references specific requirements for traceability
- All code lives in the three files: `index.html`, `css/style.css`, `js/app.js`
