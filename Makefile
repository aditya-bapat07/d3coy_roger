.PHONY: all setup test backend frontend clean

all: setup test

setup:
	python3 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

test:
	.venv/bin/pytest

backend:
	./run_backend.sh

frontend:
	./run_frontend.sh

clean:
	rm -rf .pytest_cache .venv frontend/node_modules frontend/dist
