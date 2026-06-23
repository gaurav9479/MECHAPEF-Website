#!/bin/bash
# Remove empty lines
sed -i '' '/^$/d' files_to_commit.txt
mapfile -t files < files_to_commit.txt

commit_num=1
total_commits=27
total_files=${#files[@]}
files_per_commit=$(( total_files / total_commits ))
if [ $files_per_commit -eq 0 ]; then files_per_commit=1; fi

file_idx=0

while [ $commit_num -lt $total_commits ] && [ $file_idx -lt $total_files ]; do
  added_any=0
  for (( i=0; i<$files_per_commit; i++ )); do
    if [ $file_idx -lt $total_files ]; then
      git add "${files[$file_idx]}"
      file_idx=$((file_idx + 1))
      added_any=1
    fi
  done
  
  if [ $added_any -eq 1 ]; then
    git commit -m "Admin panel and UI enhancements - Part $commit_num"
    commit_num=$((commit_num + 1))
  fi
done

# Commit any remaining files
added_any=0
while [ $file_idx -lt $total_files ]; do
  git add "${files[$file_idx]}"
  file_idx=$((file_idx + 1))
  added_any=1
done

if [ $added_any -eq 1 ]; then
  git commit -m "Final bug fixes, layout stability and cropper implementation"
fi

git push
