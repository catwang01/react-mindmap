#!/bin/bash
set -o allexport
source .env
if [ -f .env.local ]; then
    source .env.local
fi
set +o allexport

declare -a pids

# Function to kill all background jobs
cleanup() {
    echo "Cleaning up background jobs"
    for pid in "${pids[@]}"; do
        kill "$pid" 2>/dev/null
        echo "Killed process $pid"
    done
}

trap cleanup INT
trap cleanup TERM

echo "Building for version ${TAG}"
echo "Building frontend image..."
frontend/build-multi-arch.sh > frontend.log 2>&1 &
pid=$!
echo "Start a subprocess $pid for frontend"
pids+=("$pid")

echo "Building backend image..."
backend/build-multi-arch.sh > backend.log 2>&1 &
pid=$!
echo "Start a subprocess $pid for backend"
pids+=("$pid")

# Wait for all background processes to complete (optional)
for pid in "${pids[@]}"; do
    wait "$pid"
done

echo "The main script exits"