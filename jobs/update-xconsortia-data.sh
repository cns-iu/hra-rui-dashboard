#!/bin/bash

# Prompt for SENNET_TOKEN if not set
if [ -z "$SENNET_TOKEN" ]; then
	echo "Enter SenNet Token"
	read SENNET_TOKEN
  export SENNET_TOKEN
fi

# Prompt for HUBMAP_TOKEN if not set
if [ -z "$HUBMAP_TOKEN" ]; then
	echo "Enter HuBMAP Token"
	read HUBMAP_TOKEN
  export HUBMAP_TOKEN
fi

node src/xconsortia/export-cli.js

for portal in hubmap sennet; do
	for type in datasets blocks; do
		node src/update-summary.js docs/raw-data/${portal}.${type}.csv docs/summaries/${portal}.${type}.csv
	done
done
