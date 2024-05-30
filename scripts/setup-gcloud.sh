#!/bin/bash

echo "Setting up gcloud"

gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud auth configure-docker -q $CR_HOST
