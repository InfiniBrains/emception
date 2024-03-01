#!/usr/bin/env bash

cp -r build/emception/* npm/
cp README.md npm/
cd npm
npm publish
