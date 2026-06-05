#!/bin/bash

source .env.sh

./jobs/update-xconsortia-data.sh

node src/update-summary-db.js
