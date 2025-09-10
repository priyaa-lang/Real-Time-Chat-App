
        document.addEventListener('DOMContentLoaded', () => {
           
            const taskInput = document.getElementById('task-input');
            const taskCategory = document.getElementById('task-category');
            const taskPriority = document.getElementById('task-priority');
            const taskDate = document.getElementById('task-date');
            const addBtn = document.getElementById('add-btn');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');
            const themeToggle = document.getElementById('theme-toggle');
            const filterBtns = document.querySelectorAll('.filter-btn');
            
        
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            
       
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
            
            // Show notification
            function showNotification(message, type = 'success') {
                notificationMessage.textContent = message;
                notification.className = `notification ${type} show`;
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }
            
            
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
  
            function formatDate(dateString) {
                if (!dateString) return '';
                
                const options = { month: 'short', day: 'numeric' };
                const date = new Date(dateString);
                return date.toLocaleDateString(undefined, options);
            }
            
          
            function createTaskElement(task) {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;
                
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${task.text}</div>
                        <div class="task-meta">
                            <span class="task-category category-${task.category}">${task.category}</span>
                            <span class="priority-${task.priority}">
                                <i class="fas fa-flag"></i> ${task.priority} priority
                            </span>
                            ${task.dueDate ? `<span><i class="fas fa-calendar-day"></i> ${formatDate(task.dueDate)}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-icon btn-edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                return li;
            }
            
           
            function renderTasks() {
                taskList.innerHTML = '';
                
                let filteredTasks = tasks;
                
              
                if (currentFilter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                } else if (currentFilter !== 'all') {
                    filteredTasks = tasks.filter(task => task.category === currentFilter);
                }
                
                if (filteredTasks.length === 0) {
                    emptyState.style.display = 'block';
                    return;
                }
                
                emptyState.style.display = 'none';
                
                filteredTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            }
            
           
            function addTask() {
                const taskText = taskInput.value.trim();
                
                if (taskText === '') {
                    showNotification('Please enter a task description', 'error');
                    return;
                }
                
                const newTask = {
                    id: Date.now(),
                    text: taskText,
                    category: taskCategory.value,
                    priority: taskPriority.value,
                    dueDate: taskDate.value,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                
               
                taskInput.value = '';
                taskDate.value = '';
                
                showNotification('Task added successfully!');
            }
            
          
            function deleteTask(id) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                showNotification('Task deleted!');
            }
            
            
            function toggleTask(id) {
                tasks = tasks.map(task => {
                    if (task.id === id) {
                        return { ...task, completed: !task.completed };
                    }
                    return task;
                });
                saveTasks();
                renderTasks();
            }
            
          
            function editTask(id) {
                const task = tasks.find(task => task.id === id);
                if (!task) return;
                
                const taskElement = document.querySelector(`li[data-id="${id}"]`);
                const taskTitleElement = taskElement.querySelector('.task-title');
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'form-control';
                
                taskTitleElement.replaceWith(input);
                input.focus();
                input.select();
                
                function saveEdit() {
                    const newText = input.value.trim();
                    if (newText === '') {
                        showNotification('Task cannot be empty', 'error');
                        return;
                    }
                    
                    tasks = tasks.map(t => {
                        if (t.id === id) {
                            return { ...t, text: newText };
                        }
                        return t;
                    });
                    
                    saveTasks();
                    renderTasks();
                    showNotification('Task updated!');
                }
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        renderTasks();
                    }
                });
            }
            
         
            function toggleTheme() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
            }
            
            function updateThemeIcon(theme) {
                const icon = theme === 'light' ? 'fa-moon' : 'fa-sun';
                themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
            }
            
           
            addBtn.addEventListener('click', addTask);
            
            taskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
            
            taskList.addEventListener('click', (e) => {
                const taskElement = e.target.closest('.task-item');
                if (!taskElement) return;
                
                const taskId = parseInt(taskElement.dataset.id);
                
                if (e.target.classList.contains('task-checkbox')) {
                    toggleTask(taskId);
                } else if (e.target.closest('.btn-edit')) {
                    editTask(taskId);
                } else if (e.target.closest('.btn-delete')) {
                    deleteTask(taskId);
                }
            });
            
            themeToggle.addEventListener('click', toggleTheme);
            
          
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    renderTasks();
                });
            });
            
          
            renderTasks();
        });
  