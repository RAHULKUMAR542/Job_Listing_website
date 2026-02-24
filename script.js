let jobs = [];

const jobContainer = document.getElementById("jobContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const categoryFilter = document.getElementById("categoryFilter");
const experienceFilter = document.getElementById("experienceFilter");
const clearFilters = document.getElementById("clearFilters");
const pagination = document.getElementById("pagination");
const modal = document.getElementById("jobModal");
const closeModalBtn = document.getElementById("closeModal");
const sortBy = document.getElementById("sortBy");
const resultsCount = document.getElementById("resultsCount");
const modalTitle = document.getElementById("modalTitle");
const modalCompany = document.getElementById("modalCompany");
const modalLocation = document.getElementById("modalLocation");
const modalType = document.getElementById("modalType");
const modalSalary = document.getElementById("modalSalary");
const modalExperience = document.getElementById("modalExperience");
const modalDescription = document.getElementById("modalDescription");
const toggleSavedViewBtn = document.getElementById("toggleSavedView");

const jobsPerPage = 3;
let currentPage = 1;
let currentFilteredJobs = [];
let showSavedOnly = false;

async function loadJobs() {
  const response = await fetch("jobs.json");
  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Jobs data is not an array");
  }

  jobs = data;
  currentFilteredJobs = [...jobs];
}

function readSavedJobs() {
  const stored = localStorage.getItem("savedJobs");
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedJobs(ids) {
  localStorage.setItem("savedJobs", JSON.stringify(ids));
}

function formatPosted(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function sortJobs(list) {
  const sortValue = sortBy ? sortBy.value : "recent";
  const sorted = [...list];

  if (sortValue === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "oldest") {
    sorted.sort((a, b) => new Date(a.posted) - new Date(b.posted));
  } else {
    // recent
    sorted.sort((a, b) => new Date(b.posted) - new Date(a.posted));
  }

  return sorted;
}

function getFilteredJobs() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const savedIds = showSavedOnly ? readSavedJobs() : null;

  const filtered = jobs.filter(job => {
    const matchesSaved = !showSavedOnly || (savedIds && savedIds.includes(job.id));
    const matchesSearch = job.title.toLowerCase().includes(searchTerm);
    const matchesLocation = (locationFilter.value === "" || job.location === locationFilter.value);
    const matchesCategory = (categoryFilter.value === "" || job.category === categoryFilter.value);
    const matchesExperience = (experienceFilter.value === "" || job.experience === experienceFilter.value);
    return matchesSaved && matchesSearch && matchesLocation && matchesCategory && matchesExperience;
  });

  return sortJobs(filtered);
}

function updateResultsSummary() {
  if (!resultsCount) return;
  const total = currentFilteredJobs.length;
  const baseText = `${total} job${total === 1 ? "" : "s"} found`;
  resultsCount.textContent = showSavedOnly ? `${baseText} (saved)` : baseText;
}

function renderJobs() {
  jobContainer.innerHTML = "";

  const start = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = currentFilteredJobs.slice(start, start + jobsPerPage);

  if (paginatedJobs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No jobs found. Try adjusting your search or filters.";
    jobContainer.appendChild(empty);
    return;
  }

  const savedJobs = readSavedJobs();

  paginatedJobs.forEach(job => {
    const isSaved = savedJobs.includes(job.id);
    const card = document.createElement("article");
    card.classList.add("job-card");

    card.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong></p>
      <p>${job.location}</p>
      <p>${job.type} • ${job.salary}</p>
      <p>${job.experience} • Posted: ${formatPosted(job.posted)}</p>
      <button data-action="view" data-id="${job.id}">View More</button>
      <button
        class="save-btn${isSaved ? " saved" : ""}"
        data-action="save"
        data-id="${job.id}"
        ${isSaved ? "disabled" : ""}
      >
        ${isSaved ? "Saved" : "Save"}
      </button>
    `.trim();

    jobContainer.appendChild(card);
  });
}

function renderPagination() {
  pagination.innerHTML = "";

  const pageCount = Math.ceil(currentFilteredJobs.length / jobsPerPage);
  if (pageCount <= 1) return;

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    if (i === currentPage) {
      btn.classList.add("active-page");
      btn.disabled = true;
    }
    btn.addEventListener("click", () => {
      currentPage = i;
      renderJobs();
      renderPagination();
    });
    pagination.appendChild(btn);
  }
}

function applyFilters() {
  currentFilteredJobs = getFilteredJobs();
  currentPage = 1;

  updateResultsSummary();

  renderJobs();
  renderPagination();
}

function openJobModal(id) {
  const job = jobs.find(j => j.id === id);
  if (!job) return;

  modalTitle.innerText = job.title;
  modalCompany.innerText = "Company: " + job.company;
  modalLocation.innerText = "Location: " + job.location;
  modalType.innerText = "Type: " + job.type;
  modalSalary.innerText = "Salary: " + job.salary;
  modalExperience.innerText = "Experience: " + job.experience;
  modalDescription.innerText = job.description;
  modal.style.display = "block";
}

function closeModal() {
  modal.style.display = "none";
}

function saveJob(id) {
  let savedJobs = readSavedJobs();

  if (!savedJobs.includes(id)) {
    savedJobs.push(id);
    writeSavedJobs(savedJobs);
    alert("Job saved!");
    applyFilters();
  }
}

function debounce(fn, delay) {
  let timerId;
  return function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Event listeners
searchInput.addEventListener("input", debounce(applyFilters, 200));
locationFilter.addEventListener("change", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
experienceFilter.addEventListener("change", applyFilters);
if (sortBy) {
  sortBy.addEventListener("change", applyFilters);
}

if (toggleSavedViewBtn) {
  toggleSavedViewBtn.addEventListener("click", () => {
    showSavedOnly = !showSavedOnly;
    toggleSavedViewBtn.classList.toggle("active", showSavedOnly);
    toggleSavedViewBtn.textContent = showSavedOnly ? "Show All Jobs" : "Show Saved Jobs";
    applyFilters();
  });
}

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  locationFilter.value = "";
  categoryFilter.value = "";
  experienceFilter.value = "";
  applyFilters();
});

jobContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "view") {
    openJobModal(id);
  } else if (action === "save") {
    saveJob(id);
  }
});

closeModalBtn.addEventListener("click", closeModal);

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.style.display === "block") {
    closeModal();
  }
});

async function init() {
  jobContainer.innerHTML = "";
  const loadingEl = document.createElement("p");
  loadingEl.className = "empty-state";
  loadingEl.textContent = "Loading jobs...";
  jobContainer.appendChild(loadingEl);

  try {
    await loadJobs();
    applyFilters();
  } catch (error) {
    console.error(error);
    jobContainer.innerHTML = "";
    const errorEl = document.createElement("p");
    errorEl.className = "empty-state";
    errorEl.textContent = "Could not load jobs. Please try again later.";
    jobContainer.appendChild(errorEl);
    updateResultsSummary();
  }
}

init();