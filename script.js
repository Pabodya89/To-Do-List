let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const taskList = document.getElementById('task-list');
const viewMoreBtn = document.getElementById('view-more');
const DISPLAY_LIMIT = 5;
let currentLimit = DISPLAY_LIMIT;
let currentFilter = 'incomplete';

function formatTimeOnly(datetime) {
  return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTimeDiff(start, end) {
  const diffMs = new Date(end) - new Date(start);
  if (diffMs <= 0) return 'Expired';
  const minutes = Math.floor(diffMs / 60000);
  return `${minutes} min`;
}

function cleanExpiredTasks() {
  const now = new Date();
  tasks = tasks.filter(task => new Date(task.completeTime) > now || task.completed);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks(limit = DISPLAY_LIMIT) {
  cleanExpiredTasks();
  taskList.innerHTML = '';
  const filtered = tasks.filter(task =>
    currentFilter === 'complete' ? task.completed : !task.completed
  );
  const sliced = filtered.slice(0, limit);

  sliced.forEach((task, index) => {
    const tr = document.createElement('tr');
    const timeLeft = task.completed
      ? '-'
      : getTimeDiff(task.timestamp, task.completeTime);

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${task.text}</td>
      <td>${formatTimeOnly(task.completeTime)}</td>
      <td>${task.completed ? '✅ Complete' : '❌ Incomplete'}</td>
      <td>${timeLeft}</td>
      <td>
        ${!task.completed
          ? `<button onclick="toggleTask(${getTaskIndex(task)})" class="btn-mark-complete">Mark Complete</button>`
          : `<button onclick="toggleTask(${getTaskIndex(task)})" class="btn-mark-incomplete">Mark InComplete</button>`}
      </td>
      <td>
        <button onclick="editTask(${getTaskIndex(task)})" class="btn-edit">Edit</button>
        <button onclick="deleteTask(${getTaskIndex(task)})" class="btn-delete">Delete</button>
      </td>
    `;
    taskList.appendChild(tr);
  });

  viewMoreBtn.style.display = filtered.length > limit ? 'block' : 'none';
}

function getTaskIndex(taskObj) {
  return tasks.findIndex(t => t.timestamp === taskObj.timestamp);
}

function addTaskPopup() {
  Swal.fire({
    title: 'Add New Task',
    html: `
      <input id="swal-input1" class="swal2-input" placeholder="Task">
      <p>Time (which time to complete):</p>
      <input id="swal-input2" class="swal2-input" type="time">
    `,
    focusConfirm: false,
    preConfirm: () => {
      const taskText = document.getElementById('swal-input1').value.trim();
      const timeInput = document.getElementById('swal-input2').value;

      if (!taskText || !timeInput) {
        Swal.showValidationMessage('Both fields are required!');
        return false;
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const completeTime = `${today}T${timeInput}`;
      const now = new Date();
      const completeDate = new Date(completeTime);

      if (completeDate <= now) {
        Swal.showValidationMessage('Complete time must be later than now!');
        return false;
      }

      return { taskText, completeTime };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { taskText, completeTime } = result.value;
      const timestamp = new Date().toISOString();
      tasks.push({
        text: taskText,
        timestamp,
        completeTime,
        completed: false
      });
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks(currentLimit);
      Swal.fire('Task Added!', '', 'success');
    }
  });
}

function toggleTask(index) {
  tasks[index].completed = true;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks(currentLimit);
}

function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks(currentLimit);
  Swal.fire('Deleted!', '', 'success');
}

function editTask(index) {
  Swal.fire({
    title: 'Edit Task',
    input: 'text',
    inputValue: tasks[index].text,
    showCancelButton: true,
    confirmButtonText: 'Save',
    inputValidator: value => !value.trim() && 'Task cannot be empty!'
  }).then(result => {
    if (result.isConfirmed) {
      tasks[index].text = result.value.trim();
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks(currentLimit);
    }
  });
}

document.getElementById('btn-add').addEventListener('click', addTaskPopup);
document.getElementById('btn-complete').addEventListener('click', () => {
  currentFilter = 'complete';
  currentLimit = DISPLAY_LIMIT;
  renderTasks(currentLimit);
});
document.getElementById('btn-incomplete').addEventListener('click', () => {
  currentFilter = 'incomplete';
  currentLimit = DISPLAY_LIMIT;
  renderTasks(currentLimit);
});
viewMoreBtn.addEventListener('click', () => {
  currentLimit += DISPLAY_LIMIT;
  renderTasks(currentLimit);
});

renderTasks();
