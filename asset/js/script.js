let todoId = 1;
let originalTodos = {};
let todos = {};
let timerIntervals = {};

document.addEventListener("DOMContentLoaded", loadTodosFromLocalStorage);
document.getElementById("addButton").addEventListener("click", addTodo);
document.getElementById("itemName").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        addTodo();
    }
});


// Function to load todos into the UI

function loadTodosFromLocalStorage() {
    todos = JSON.parse(JSON.stringify(originalTodos));

    const tableBody = document.getElementById("todoList").querySelector("tbody");
    tableBody.innerHTML = "";

    const currentTime = Date.now();

    for (let id in todos) {

        const switchStatus = localStorage.getItem(`todo_${id}_status`);
        if (switchStatus) {
            todos[id].status = switchStatus;
        }


        const savedTimer = localStorage.getItem(`todo_${id}_timer`);
        if (savedTimer) {
            todos[id].timer = parseInt(savedTimer, 10);
        } else {
            todos[id].timer = 0;
        }


        const savedStartTime = localStorage.getItem(`todo_${id}_startTime`);
        if (todos[id].status === "Ongoing" && savedStartTime) {
            const elapsedTime = Math.floor((currentTime - parseInt(savedStartTime, 10)) / 1000);
            todos[id].timer += elapsedTime;
        } else if (todos[id].status === "Pending") {
            todos[id].timer = 0;
        }

        renderTodoRow(todos[id]);


        updateSwitchUI(id, todos[id].status);
        updateTimerDisplay(id);


        if (todos[id].status === "Ongoing") {
            startTimer(id);
        }
    }


    todoId = Object.keys(todos).length > 0 ? Math.max(...Object.keys(todos).map(Number)) + 1 : 1;
    updateTotalTasks();
}

// reset the data to originalTodos when refresh

window.addEventListener('beforeunload', function () {
    // Reset localStorage to original data before the page unloads
    localStorage.setItem('todos', JSON.stringify(originalTodos));
});

//  save todos to localStorage
function saveTodosToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(originalTodos));
}

// add a new todo
function addTodo() {
    const itemName = document.getElementById("itemName").value;
    if (itemName === "") {
        alert("Please enter an item name!");
        return;
    }

    const todo = { id: todoId, itemName, timer: 0, status: "Pending", startTime: null };
    todos[todoId] = todo;
    originalTodos[todoId] = todo;
    saveTodosToLocalStorage();
    renderTodoRow(todo);

    document.getElementById("itemName").value = "";
    todoId++;
    updateTotalTasks();
}

// update total tasks count
function updateTotalTasks() {
    const totalTasks = Object.keys(todos).length;
    document.getElementById("totalTasks").textContent = totalTasks;

    const noTasksMessage = document.getElementById("noTasksMessage");
    if (totalTasks === 0) {
        noTasksMessage.style.display = "block";  
    } else {
        noTasksMessage.style.display = "none"; 
    }
}

//  render a single todo row in the table
function renderTodoRow(todo) {
    const tableBody = document.getElementById("todoList").querySelector("tbody");
    const row = document.createElement("tr");
    row.setAttribute("id", `todo-${todo.id}`);

    row.innerHTML = `
        <td>
            <input type="text" id="edit-input-${todo.id}" value="${todo.itemName}" style="display:none;" />
            <span id="item-${todo.id}">${todo.itemName}</span>
        </td>
        <td class="table-actions">
            <button class="btn btn-warning btn-sm" id="edit-button-${todo.id}" onclick="editTodo(${todo.id})">
                <i class="bi bi-pencil-fill"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmDelete(${todo.id})">
                <i class="bi bi-trash-fill"></i>
            </button>
        </td>
        <td>
            <span class="timer" id="timer-${todo.id}">00:00:00</span> <!-- Timer initially shows 0 -->
        </td>
        <td>
            <div class="toggle-switch">
                <div class="switch ${todo.status.toLowerCase()}" id="switch-${todo.id}" onclick="handleSwitch(${todo.id})">
                    <div class="knob" id="knob-${todo.id}"></div>
                </div>
            </div>
        </td>
    `;
    tableBody.appendChild(row);
}


function handleSwitch(id) {
    const switchElement = document.getElementById(`switch-${id}`);
    const knobElement = document.getElementById(`knob-${id}`);

    if (todos[id].status === "Pending") {

        todos[id].status = "Ongoing";
        todos[id].startTime = Date.now();
        startTimer(id);
        knobElement.style.left = "35%";
        switchElement.className = "switch ongoing";
    } else if (todos[id].status === "Ongoing") {

        todos[id].status = "Complete";
        stopTimer(id);
        knobElement.style.left = "76%";
        switchElement.className = "switch complete";
    } else {

        todos[id].status = "Pending";
        stopTimer(id);
        todos[id].timer = 0;
        updateTimerDisplay(id);
        knobElement.style.left = "0%";
        switchElement.className = "switch pending";
    }


    localStorage.setItem(`todo_${id}_status`, todos[id].status);
    saveTodosToLocalStorage();
}

// update the switch UI based on the current status
function updateSwitchUI(id, status) {
    const switchElement = document.getElementById(`switch-${id}`);
    const knobElement = document.getElementById(`knob-${id}`);

    if (status === "Ongoing") {
        knobElement.style.left = "35%";
        switchElement.className = "switch ongoing";
    } else if (status === "Complete") {
        knobElement.style.left = "76%";
        switchElement.className = "switch complete";
    } else {
        knobElement.style.left = "0%";
        switchElement.className = "switch pending";
    }
}


function stopTimer(id) {
    clearInterval(timerIntervals[id]);
    delete timerIntervals[id];
    localStorage.setItem(`todo_${id}_timer`, todos[id].timer);
}

function confirmDelete(id) {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger"
        },
        buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "You won't be delete task!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Perform the deletion if confirmed
            deleteTodo(id);

            // Show success message
            swalWithBootstrapButtons.fire({
                title: "Deleted!",
                text: "Your task has been deleted.",
                icon: "success"
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Show canceled message if deletion is canceled
            swalWithBootstrapButtons.fire({
                title: "Cancelled",
                text: "Your task is safe :)",
                icon: "error"
            });
        }
    });
}



function deleteTodo(id) {
    delete todos[id];
    delete originalTodos[id];
    localStorage.removeItem(`todo_${id}_timer`);
    saveTodosToLocalStorage();
    document.getElementById(`todo-${id}`).remove();
    updateTotalTasks();
}

// Function to edit a todo
function editTodo(id) {
    const itemNameElement = document.getElementById(`item-${id}`);
    const editInputElement = document.getElementById(`edit-input-${id}`);
    const isEditing = editInputElement.style.display === "block";

    if (isEditing) {
        // Show confirmation alert before saving changes
        Swal.fire({
            title: "Are you sure?",
            text: "You want be edit this task!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, save it!"
        }).then((result) => {
            if (result.isConfirmed) {
                // Save the changes if the user confirms
                todos[id].itemName = editInputElement.value;
                originalTodos[id].itemName = editInputElement.value;
                itemNameElement.textContent = todos[id].itemName;
                editInputElement.style.display = "none";
                itemNameElement.style.display = "inline";
                saveTodosToLocalStorage();

                // Show success message
                Swal.fire({
                    title: "Saved!",
                    text: "Your changes have been saved.",
                    icon: "success"
                });
            } else {
                // If canceled, return to editing mode
                editInputElement.focus();
            }
        });
    } else {
        // Enter edit mode
        editInputElement.style.display = "block";
        itemNameElement.style.display = "none";
        editInputElement.focus();
    }
}


function startTimer(id) {
    if (!timerIntervals[id]) {
        timerIntervals[id] = setInterval(() => {
            todos[id].timer++;
            localStorage.setItem(`todo_${id}_timer`, todos[id].timer);
            updateTimerDisplay(id);
        }, 1000);
    }
}


function stopTimer(id) {
    clearInterval(timerIntervals[id]);
    delete timerIntervals[id];
}


function formatTime(seconds) {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

function updateTimerDisplay(id) {
    const timerSpan = document.getElementById(`timer-${id}`);
    const timerValue = todos[id].timer;
    timerSpan.textContent = formatTime(timerValue);
}


function filterTodos(status, button) {
    const allRows = document.querySelectorAll("#todoList tbody tr");

    allRows.forEach(row => {
        const todoId = row.getAttribute("id").split('-')[1];
        const todo = todos[todoId];

        if (status === 'All' || todo.status === status) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });


    const buttons = document.querySelectorAll(".filter-button");
    buttons.forEach(btn => btn.classList.remove("active"));


    button.classList.add("active");
}


function clearCompletedTodos(button) {
    Swal.fire({
        title: "Are you sure?",
        text: "You want be clear completed task!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, clear completed it!"
    }).then((result) => {
        if (result.isConfirmed) {

            for (let id in todos) {
                if (todos[id].status === 'Complete') {

                    document.getElementById(`todo-${id}`).remove();

                    delete todos[id];
                    localStorage.removeItem(`todo_${id}_timer`);
                }
            }

            saveTodosToLocalStorage();
            filterTodos('Pending', document.querySelector('.filter-buttons .btn-danger'));
            updateTotalTasks();


            const buttons = document.querySelectorAll('.filter-buttons .btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });


            button.classList.add('active');

            Swal.fire({
                title: "Deleted!",
                text: "All completed tasks have been deleted.",
                icon: "success"
            });
        }
    });
}

//validate todos data structure
function isValidTodos(data) {
    if (typeof data !== 'object' || data === null) return false;

    for (let key in data) {
        let todo = data[key];
        if (!todo.hasOwnProperty('id') ||
            !todo.hasOwnProperty('itemName') ||
            !todo.hasOwnProperty('timer') ||
            !todo.hasOwnProperty('status')) {
            return false;
        }
    }
    return true;
}

// Load todos from localStorage and ensure validity
document.addEventListener("DOMContentLoaded", function () {
    let storedTodos = JSON.parse(localStorage.getItem('todos')) || {};

    if (!isValidTodos(storedTodos)) {
        storedTodos = {};
        localStorage.setItem('todos', JSON.stringify(storedTodos));
    }

    originalTodos = storedTodos;
    todos = JSON.parse(JSON.stringify(originalTodos));

    loadTodosFromLocalStorage();
});

// reset localStorage todos if modified manually
window.addEventListener('storage', function (event) {
    if (event.key === 'todos') {
        let modifiedTodos = JSON.parse(event.newValue);
        if (!isValidTodos(modifiedTodos)) {
            localStorage.setItem('todos', JSON.stringify(originalTodos));
        }
    }
});
