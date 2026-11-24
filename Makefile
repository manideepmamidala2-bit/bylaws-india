.PHONY: setup generate check-provenance test

setup:
	cd pipeline && uv sync --frozen --extra dev
	npm ci

generate:
	cd pipeline && uv run python ../scripts/generate_models.py

check-provenance:
	cd pipeline && uv run bylaws check-provenance

test:
	cd pipeline && uv run ruff check . && uv run bylaws check-provenance && uv run pytest
	npm run lint && npm run typecheck && npm test
