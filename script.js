
        // Mock Socket.IO implementation for demonstration
        class MockSocket {
            constructor() {
                this.events = {};
                this.connected = true;
                this.id = 'user_' + Math.random().toString(36).substr(2, 9);
            }

            on(event, callback) {
                if (!this.events[event]) this.events[event] = [];
                this.events[event].push(callback);
            }

            emit(event, data) {
                // Simulate server responses
                setTimeout(() => {
                    if (event === 'joinRoom') {
                        this.simulateRoomJoin(data);
                    } else if (event === 'sendMessage') {
                        this.simulateMessageBroadcast(data);
                    } else if (event === 'typing') {
                        this.simulateTypingIndicator(data);
                    }
                }, 100);
            }

            simulateRoomJoin(data) {
                // Simulate other users joining
                const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
                const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
                
                this.events['roomUsers']?.forEach(cb => cb({
                    users: [data.username, ...randomUsers],
                    count: randomUsers.length + 1
                }));

                // Simulate welcome message
                setTimeout(() => {
                    this.events['newMessage']?.forEach(cb => ({
                        username: 'System',
                        message: `Welcome to ${data.room}!`,
                        timestamp: new Date().toISOString(),
                        isSystem: true
                    }));
                }, 500);
            }

            simulateMessageBroadcast(data) {
                this.events['newMessage']?.forEach(cb => cb(data));
                
                // Simulate random responses
                if (Math.random() > 0.7) {
                    setTimeout(() => {
                        const responses = [
                            "That's interesting!",
                            "I agree with you.",
                            "Great point!",
                            "Thanks for sharing!",
                            "Nice to meet you here!"
                        ];
                        const randomUser = ['Alice', 'Bob', 'Charlie', 'Diana'][Math.floor(Math.random() * 4)];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        
                        this.events['newMessage']?.forEach(cb => cb({
                            username: randomUser,
                            message: randomResponse,
                            timestamp: new Date().toISOString()
                        }));
                    }, Math.random() * 3000 + 1000);
                }
            }

            simulateTypingIndicator(data) {
                this.events['userTyping']?.forEach(cb => cb(data));
            }
        }

        // Initialize variables
        let socket = new MockSocket();
        let currentUser = localStorage.getItem('chatUsername') || 'User' + Math.floor(Math.random() * 1000);
        let currentRoom = null;
        let messageCount = 0;
        let typingTimer = null;

        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('username').textContent = currentUser;
            localStorage.setItem('chatUsername', currentUser);
            loadRooms();
            setupSocketListeners();
        });

        // Setup socket event listeners
        function setupSocketListeners() {
            socket.on('newMessage', (data) => {
                addMessageToChat(data);
            });

            socket.on('roomUsers', (data) => {
                updateUsersList(data.users);
                document.getElementById('onlineCount').textContent = data.count;
            });

            socket.on('userTyping', (data) => {
                if (data.isTyping) {
                    document.getElementById('typingIndicator').classList.remove('hidden');
                } else {
                    document.getElementById('typingIndicator').classList.add('hidden');
                }
            });
        }

        // Room management
        function loadRooms() {
            const rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
            if (rooms.length === 0) {
                // Create default rooms
                const defaultRooms = [
                    { name: 'General', created: new Date().toISOString(), users: Math.floor(Math.random() * 20) + 5 },
                    { name: 'Technology', created: new Date().toISOString(), users: Math.floor(Math.random() * 15) + 3 },
                    { name: 'Random', created: new Date().toISOString(), users: Math.floor(Math.random() * 10) + 2 }
                ];
                localStorage.setItem('chatRooms', JSON.stringify(defaultRooms));
                displayRooms(defaultRooms);
            } else {
                displayRooms(rooms);
            }
        }

        function displayRooms(rooms) {
            const roomsList = document.getElementById('roomsList');
            roomsList.innerHTML = rooms.map(room => `
                <div class="room-card bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100" 
                     onclick="joinRoom('${room.name}')">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-lg">${room.name}</h3>
                        <span class="text-sm text-gray-500">
                            <i class="fas fa-users mr-1"></i>${room.users}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">Created ${new Date(room.created).toLocaleDateString()}</p>
                </div>
            `).join('');
        }

        function createRoom() {
            const roomName = document.getElementById('newRoomName').value.trim();
            if (!roomName) {
                showNotification('Please enter a room name', 'error');
                return;
            }

            const rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
            if (rooms.find(r => r.name === roomName)) {
                showNotification('Room already exists', 'error');
                return;
            }

            const newRoom = {
                name: roomName,
                created: new Date().toISOString(),
                users: 1
            };

            rooms.push(newRoom);
            localStorage.setItem('chatRooms', JSON.stringify(rooms));
            displayRooms(rooms);
            document.getElementById('newRoomName').value = '';
            showNotification('Room created successfully!', 'success');
        }

        function joinRoom(roomName) {
            currentRoom = roomName;
            messageCount = 0;
            
            document.getElementById('roomSelection').classList.add('hidden');
            document.getElementById('chatView').classList.remove('hidden');
            document.getElementById('currentRoomName').textContent = roomName;
            document.getElementById('modalRoomName').textContent = roomName;
            document.getElementById('modalRoomCreated').textContent = new Date().toLocaleDateString();
            
            // Clear previous messages
            document.getElementById('messagesContainer').innerHTML = '';
            
            // Emit join room event
            socket.emit('joinRoom', {
                room: roomName,
                username: currentUser
            });

            // Focus message input
            document.getElementById('messageInput').focus();
        }

        function leaveRoom() {
            currentRoom = null;
            document.getElementById('chatView').classList.add('hidden');
            document.getElementById('roomSelection').classList.remove('hidden');
            document.getElementById('typingIndicator').classList.add('hidden');
        }

        // Message handling
        function sendMessage(event) {
            event.preventDefault();
            
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            const messageData = {
                username: currentUser,
                message: message,
                timestamp: new Date().toISOString(),
                room: currentRoom
            };
            
            socket.emit('sendMessage', messageData);
            messageInput.value = '';
            messageCount++;
            document.getElementById('modalMessageCount').textContent = messageCount;
        }

        function addMessageToChat(data) {
            const messagesContainer = document.getElementById('messagesContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-animation';
            
            const isOwnMessage = data.username === currentUser;
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            
            if (data.isSystem) {
                messageDiv.innerHTML = `
                    <div class="text-center">
                        <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            ${data.message}
                        </span>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
                        <div class="message-bubble ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} 
                                    px-4 py-2 rounded-lg">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-semibold ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}">
                                    ${data.username}
                                </span>
                                <span class="text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'} ml-2">
                                    ${timestamp}
                                </span>
                            </div>
                            <p class="text-sm">${data.message}</p>
                        </div>
                    </div>
                `;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Typing indicator
        function handleTyping() {
            socket.emit('typing', { isTyping: true });
            
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                socket.emit('typing', { isTyping: false });
            }, 1000);
        }

        // Users list
        function updateUsersList(users) {
            const usersList = document.getElementById('usersList');
            usersList.innerHTML = users.map(user => `
                <div class="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        ${user.charAt(0).toUpperCase()}
                    </div>
                    <span class="text-sm ${user === currentUser ? 'font-semibold text-blue-600' : 'text-gray-700'}">
                        ${user} ${user === currentUser ? '(You)' : ''}
                    </span>
                </div>
            `).join('');
        }

        // Room info modal
        function showRoomInfo() {
            document.getElementById('roomInfoModal').classList.remove('hidden');
        }

        function closeRoomInfo() {
            document.getElementById('roomInfoModal').classList.add('hidden');
        }

        // Utility functions
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
                type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('chatUsername');
                location.reload();
            }
        }

        // Handle Enter key in room name input
        document.getElementById('newRoomName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createRoom();
            }
        });
