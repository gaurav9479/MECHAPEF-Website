#!/bin/bash
set -e

# Make sure we start from the clean base branch
git checkout collaborator-gaurav

# Branch 1
git checkout -b feature-backend-refactor-models
git add -A backend/src/models
git commit -m "refactor: rename backend models to use .model.js extension"
git checkout collaborator-gaurav
git merge feature-backend-refactor-models

# Branch 2
git checkout -b feature-backend-refactor-controllers
git add -A backend/src/controllers
git commit -m "refactor: rename backend controllers to use .controller.js extension"
git checkout collaborator-gaurav
git merge feature-backend-refactor-controllers

# Branch 3
git checkout -b feature-backend-routes-refactor
git add -A backend/src/routes
git commit -m "refactor: update routes to use new controller imports and add albums"
git checkout collaborator-gaurav
git merge feature-backend-routes-refactor

# Branch 4
git checkout -b feature-backend-test-scripts
git add backend/test_*.js backend/update_admins.js test_db.js backend/.env.example
git commit -m "chore: add backend testing and seeder scripts"
git checkout collaborator-gaurav
git merge feature-backend-test-scripts

# Branch 5
git checkout -b feature-admin-sidebar
git add Client/src/components/AdminSidebar
git commit -m "feat: create reusable AdminSidebar component with mobile drawer support"
git checkout collaborator-gaurav
git merge feature-admin-sidebar

# Branch 6
git checkout -b feature-admin-pages
git add Client/src/Pages/Admin
git commit -m "feat: integrate AdminSidebar into all admin portal pages and add AdminGallery"
git checkout collaborator-gaurav
git merge feature-admin-pages

# Branch 7
git checkout -b feature-frontend-gallery
git add Client/src/Pages/Gallery
git commit -m "feat: add Gallery page and AlbumView components"
git checkout collaborator-gaurav
git merge feature-frontend-gallery

# Branch 8
git checkout -b feature-requested-roles
git add Client/src/Pages/Register
git add Client/src/context/AuthContext.jsx
git commit -m "feat: add requested role selection to user registration"
git checkout collaborator-gaurav
git merge feature-requested-roles

# Branch 9
git checkout -b feature-cinematic-stats
git add Client/src/components/CinematicHero
git commit -m "feat: implement choreographed 90-degree 4-way stats animation"
git checkout collaborator-gaurav
git merge feature-cinematic-stats

# Branch 10
git checkout -b feature-ui-enhancements
git add -A
git commit -m "feat: update Navbar verified ring, OurTeam UI, and remaining global config"
git checkout collaborator-gaurav
git merge feature-ui-enhancements

# Force push to rewrite the history with these 10 distinct branches
git push -f origin collaborator-gaurav
