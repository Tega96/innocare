#!/bin/bash
# scripts/convert-to-typescript.sh

# Convert a specific file
convert_file() {
  local file=$1
  local js_file="${file}.js"
  local ts_file="${file}.ts"
  local jsx_file="${file}.jsx"
  local tsx_file="${file}.tsx"
  
  if [ -f "$js_file" ]; then
    echo "Converting $js_file to $ts_file"
    mv "$js_file" "$ts_file"
  elif [ -f "$jsx_file" ]; then
    echo "Converting $jsx_file to $tsx_file"
    mv "$jsx_file" "$tsx_file"
  fi
}

# Convert a directory
convert_directory() {
  local dir=$1
  echo "Processing directory: $dir"
  
  for file in "$dir"/*; do
    if [ -d "$file" ]; then
      convert_directory "$file"
    elif [[ "$file" == *.js ]] || [[ "$file" == *.jsx ]]; then
      convert_file "${file%.*}"
    fi
  done
}

# Start conversion from src
if [ -d "src" ]; then
  convert_directory "src"
  echo "Conversion complete! Now manually fix TypeScript errors."
else
  echo "src directory not found!"
fi