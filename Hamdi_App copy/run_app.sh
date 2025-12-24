#!/bin/bash

# Kill any existing processes on ports 8000 and 5173 to avoid conflicts
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend..."
python3 backend_server.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "App running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
