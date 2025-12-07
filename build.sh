#!/bin/bash

REPO="kieutung"
TAG="latest"

echo "Building NoS_TechStore..."

# Build Backend
echo "Building Backend..."
cd backend_api
docker build -t $REPO/techstore-be:$TAG .
docker push $REPO/techstore-be:$TAG
cd ..

# Build Frontend
echo "Building Frontend..."
cd tech-zen-ui
docker build -t $REPO/techstore-fe:$TAG .
docker push $REPO/techstore-fe:$TAG
cd ..

echo "Done!"
