.PHONY: generate

generate:
	cd pipeline && uv run python ../scripts/generate_models.py
