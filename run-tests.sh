#!/bin/bash

# A script to run all or individual Jest tests for the MCP project.

# Default to running all tests
TEST_TO_RUN=""

# Check if a specific test name (or pattern) is provided as the first argument
if [ "$1" ]; then
  # Use Jest's -t flag to run tests with a name matching the pattern
  TEST_TO_RUN="-t \"$1\""
  echo "Running tests matching pattern: $1"
else
  echo "Running all tests..."
fi

# First, ensure the project is compiled
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed. Aborting tests."
    exit 1
fi

# Execute Jest, passing the test name argument if it exists.
# The command is built and executed with eval to correctly handle the quoted argument.
echo "Starting Jest..."
eval "npx jest $TEST_TO_RUN"
