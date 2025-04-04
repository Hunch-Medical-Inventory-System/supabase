#!/bin/bash

# Exit on any error
set -e

# === Functions ===

function check_command {
  if ! command -v $1 &> /dev/null
  then
    echo "❌ $1 is not installed. Please install it before continuing."
    exit 1
  fi
}

# === Prerequisite Checks ===

echo "🔍 Checking prerequisites..."
check_command npm
check_command docker
echo "✅ All required tools are installed."

# === Setup ===

echo "📦 Installing Supabase CLI locally..."
npm install -D supabase


echo "⚙️ Initializing Supabase project (if not already initialized)..."
if [ ! -d "./supabase" ]; then
  npx supabase init
else
  echo "📁 Supabase project already initialized."
fi

echo "🚀 Starting Supabase local development environment (Docker)..."
npx supabase start

echo "🧹 Resetting local database and applying migrations..."
npx supabase db reset

echo "🎉 Supabase local environment is ready with migrations applied!"

