#!/bin/bash
npm run build
docker build -t rmkasendwa/sliding-tiles .
docker push rmkasendwa/sliding-tiles