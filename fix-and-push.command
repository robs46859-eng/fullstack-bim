#!/bin/bash
cd "$(dirname "$0")"

echo "================================================"
echo "  StelarBIM → GitHub Push (Clean)"
echo "================================================"
echo ""

# Remove stale lock files
rm -f .git/index.lock
rm -f .git/COMMIT_EDITMSG.lock
echo "✓ Cleared stale lock files"

# Check if gh CLI is available
if command -v gh &> /dev/null; then
  echo "✓ GitHub CLI found — using gh auth"
  gh auth status 2>/dev/null || gh auth login
fi

# Init git if needed
if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

# Ensure we're on main branch
git checkout -B main 2>/dev/null || true

# Set remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/robs46859-eng/fullstack-bim.git

# Configure identity
git config user.email "robs46859@gmail.com"
git config user.name "Robert Smith"

# Stage all files
git add -A
echo ""
echo "Staged files:"
git status --short

echo ""
echo "Committing StelarBIM cockpit build..."
git commit -m "feat: StelarBIM cockpit — Claude planning lane, 4-panel command center, Postgres backend, App Runner config" 2>&1

echo ""
echo "Pushing to main branch..."
git push -u origin main --force
PUSH_RESULT=$?

echo ""
if [ $PUSH_RESULT -eq 0 ]; then
  echo "✅ Pushed successfully to github.com/robs46859-eng/fullstack-bim"
else
  echo "⚠️  Push failed. If prompted for credentials:"
  echo "   Username: robs46859-eng"
  echo "   Password: use a GitHub Personal Access Token"
  echo "   Get one at: https://github.com/settings/tokens"
fi

echo ""
read -p "Press Enter to close..."
