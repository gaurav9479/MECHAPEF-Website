#!/bin/bash
set -e

# Currently on collaborator-gaurav. It has all the latest files.
# Let's stash them or just commit them to a temp branch.
git branch -f temp-final-state collaborator-gaurav

# Now reset collaborator-gaurav to base
git checkout collaborator-gaurav
git reset --hard ce0595f

# Cleanup old branches safely
for branch in feature-backend-refactor-models feature-backend-refactor-controllers feature-backend-routes-refactor feature-backend-test-scripts feature-admin-sidebar feature-admin-pages feature-frontend-gallery feature-requested-roles feature-cinematic-stats feature-ui-enhancements; do
  git branch -D $branch || true
done

# Function to create an independent branch from base and copy files from temp-final-state
make_branch() {
  local branch=$1
  local msg=$2
  shift 2
  
  git checkout -b $branch ce0595f
  
  # Checkout specific files from the final state
  for file in "$@"; do
    git checkout temp-final-state -- "$file" || true
  done
  
  git add .
  # Only commit if there are changes
  if ! git diff-index --quiet HEAD; then
    git commit -m "$msg"
  fi
}

make_branch feature-backend-refactor-models "refactor: rename backend models to use .model.js extension" backend/src/models/
make_branch feature-backend-refactor-controllers "refactor: rename backend controllers to use .controller.js extension" backend/src/controllers/
make_branch feature-backend-routes-refactor "refactor: update routes to use new controller imports and add albums" backend/src/routes/
make_branch feature-backend-test-scripts "chore: add backend testing and seeder scripts" backend/test_*.js backend/update_admins.js test_db.js backend/.env.example
make_branch feature-admin-sidebar "feat: create reusable AdminSidebar component with mobile drawer support" Client/src/components/AdminSidebar/
make_branch feature-admin-pages "feat: integrate AdminSidebar into all admin portal pages and add AdminGallery" Client/src/Pages/Admin/
make_branch feature-frontend-gallery "feat: add Gallery page and AlbumView components" Client/src/Pages/Gallery/
make_branch feature-requested-roles "feat: add requested role selection to user registration" Client/src/Pages/Register/ Client/src/context/AuthContext.jsx
make_branch feature-cinematic-stats "feat: implement choreographed 90-degree 4-way stats animation" Client/src/components/CinematicHero/
make_branch feature-ui-enhancements "feat: update Navbar verified ring, OurTeam UI, and remaining global config" Client/src/components/Navbar/ Client/src/components/OurTeam/ Client/src/App.jsx Client/src/Pages/Home.jsx Client/src/index.css backend/src/middleware/ backend/src/seeds/ make_commits.js make_commits.sh make_10_branches.sh make_graph_merges.sh

# Now we have 10 independent branches. Merge them sequentially into collaborator-gaurav.
git checkout collaborator-gaurav

git merge --no-ff feature-backend-refactor-models -m "Merge branch 'feature-backend-refactor-models' into collaborator-gaurav"
git merge --no-ff feature-backend-refactor-controllers -m "Merge branch 'feature-backend-refactor-controllers' into collaborator-gaurav"
git merge --no-ff feature-backend-routes-refactor -m "Merge branch 'feature-backend-routes-refactor' into collaborator-gaurav"
git merge --no-ff feature-backend-test-scripts -m "Merge branch 'feature-backend-test-scripts' into collaborator-gaurav"
git merge --no-ff feature-admin-sidebar -m "Merge branch 'feature-admin-sidebar' into collaborator-gaurav"
git merge --no-ff feature-admin-pages -m "Merge branch 'feature-admin-pages' into collaborator-gaurav"
git merge --no-ff feature-frontend-gallery -m "Merge branch 'feature-frontend-gallery' into collaborator-gaurav"
git merge --no-ff feature-requested-roles -m "Merge branch 'feature-requested-roles' into collaborator-gaurav"
git merge --no-ff feature-cinematic-stats -m "Merge branch 'feature-cinematic-stats' into collaborator-gaurav"
git merge --no-ff feature-ui-enhancements -m "Merge branch 'feature-ui-enhancements' into collaborator-gaurav"

# Delete the temp branch
git branch -D temp-final-state

# Force push the beautifully merged graph to origin
git push -f origin collaborator-gaurav
git push -f origin feature-backend-refactor-models feature-backend-refactor-controllers feature-backend-routes-refactor feature-backend-test-scripts feature-admin-sidebar feature-admin-pages feature-frontend-gallery feature-requested-roles feature-cinematic-stats feature-ui-enhancements
