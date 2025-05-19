#!/bin/bash

# Debug script to verify NestJS builds

echo "Testing NestJS build process..."

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Build all applications
echo "Building Gateway app..."
npx nest build gateway
if [ $? -ne 0 ]; then
  echo "❌ Gateway build failed!"
  exit 1
fi
echo "✅ Gateway build successful!"
ls -la dist/apps/gateway

echo "Building Auth app..."
npx nest build auth
if [ $? -ne 0 ]; then
  echo "❌ Auth build failed!"
  exit 1
fi
echo "✅ Auth build successful!"
ls -la dist/apps/auth

echo "Building Event app..."
npx nest build event
if [ $? -ne 0 ]; then
  echo "❌ Event build failed!"
  exit 1
fi
echo "✅ Event build successful!"
ls -la dist/apps/event

echo "All builds completed successfully!"