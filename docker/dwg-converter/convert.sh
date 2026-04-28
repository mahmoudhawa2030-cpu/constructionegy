#!/bin/bash

# Check if input file is provided
if [ -z "$1" ]; then
    echo "Usage: convert.sh <input.dwg> [output.pdf]"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.dwg}.pdf}"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Use LibreCAD to convert DWG to PDF
# LibreCAD needs a virtual display for headless operation
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
sleep 2

# Convert using LibreCAD CLI
librecad "$INPUT_FILE" -o "$OUTPUT_FILE" -f pdf

# Check if conversion succeeded
if [ -f "$OUTPUT_FILE" ]; then
    echo "Success: $OUTPUT_FILE"
    exit 0
else
    echo "Error: Conversion failed"
    exit 1
fi
