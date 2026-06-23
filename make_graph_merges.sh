#!/bin/bash
set -e

# Reset collaborator-gaurav to the base commit before any of our 10 new commits
git checkout collaborator-gaurav
git reset --hard ce0595f

# Merge each branch with --no-ff to force explicit merge bubbles in the Git graph
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

# Force push the beautifully merged graph to origin
git push -f origin collaborator-gaurav
