# Quest Laguna — local development shortcuts.
#
# `make` or `make help` lists everything. The common path is:
#
#   make dev      # CMS + site, one command
#   make down     # stop the CMS
#
# Everything here wraps commands documented in LOCAL.md; nothing is hidden
# magic, and each target prints what it is doing.

# Use the nvm-pinned Node when it is present, so make works from a plain
# non-interactive shell where nvm has not been sourced.
NVM_BIN := $(HOME)/.nvm/versions/node/v22.17.0/bin
ifneq ($(wildcard $(NVM_BIN)/node),)
export PATH := $(NVM_BIN):$(PATH)
endif

# The CMS stack. --env-file is required: docker-compose.yml guards
# PAYLOAD_SECRET/DB_PASSWORD with ${VAR:?} and compose resolves those before
# any overlay applies. See cms/local.env.
COMPOSE := docker compose --env-file local.env -f docker-compose.yml -f docker-compose.local.yml

CMS_URL ?= http://localhost:3000
SITE_PORT ?= 4321
# Local-only; the real value is a long random string set on the site service.
PREVIEW_SECRET ?= localpreview

.DEFAULT_GOAL := help
.PHONY: help install dev site cms cms-build up down reset logs shell psql \
        migrate migrate-create seed seed-admin admin optimize-assets \
        test test-cms test-all check build clean doctor

## ─── Getting started ────────────────────────────────────────────────────

help: ## Show this help
	@echo "Quest Laguna — local development"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  CMS admin  $(CMS_URL)/admin   (admin@questlaguna.local / localdev12345)"
	@echo "  Site       http://localhost:$(SITE_PORT)"
	@echo ""
	@echo "  Full walkthrough: LOCAL.md"

install: ## Install dependencies for the site and the CMS
	npm install
	cd cms && npm install

## ─── Running ────────────────────────────────────────────────────────────

dev: cms ## CMS stack (background) + site dev server (foreground). Ctrl-C stops the site.
	@echo ""
	@echo "→ CMS ready at $(CMS_URL)/admin"
	@echo "→ starting the site against it (Ctrl-C to stop; CMS keeps running)"
	@echo ""
	CMS_URL=$(CMS_URL) PREVIEW_SECRET=$(PREVIEW_SECRET) npm run dev

site: ## Site dev server only, pointed at the local CMS
	CMS_URL=$(CMS_URL) PREVIEW_SECRET=$(PREVIEW_SECRET) npm run dev

cms: ## Start the CMS + Postgres in the background and wait until it answers
	@cd cms && $(COMPOSE) up -d
	@echo -n "waiting for the CMS to come up"
	@for i in $$(seq 1 90); do \
	  if curl -sf -o /dev/null $(CMS_URL)/api/announcements 2>/dev/null; then echo " ok"; exit 0; fi; \
	  if [ -n "$$(docker ps -a --filter name=cms-payload --filter status=exited -q)" ]; then \
	    echo ""; echo "CMS container exited. Last lines:"; cd cms && $(COMPOSE) logs --tail=30 payload; exit 1; \
	  fi; \
	  echo -n "."; sleep 2; \
	done; \
	echo ""; echo "timed out. Check: make logs"; exit 1

cms-build: ## Rebuild the CMS image (after changing cms/ source or the Dockerfile)
	cd cms && $(COMPOSE) up -d --build

up: cms ## Alias for `make cms`

down: ## Stop the CMS stack (keeps the database)
	cd cms && $(COMPOSE) down

reset: ## Stop the CMS and DELETE its database + uploads, then start fresh
	cd cms && $(COMPOSE) down -v
	@$(MAKE) --no-print-directory cms

logs: ## Follow the CMS logs
	cd cms && $(COMPOSE) logs -f payload

shell: ## Open a shell inside the running CMS container
	cd cms && $(COMPOSE) exec payload sh

psql: ## Open psql against the local CMS database
	cd cms && $(COMPOSE) exec postgres psql -U payload -d quest_content

## ─── Database & content ─────────────────────────────────────────────────

migrate: ## Apply pending migrations to the running CMS
	cd cms && $(COMPOSE) exec payload npx payload migrate

migrate-create: ## Generate a migration after changing a collection (commit the result!)
	@echo "Generating against the local database (needs: make cms)…"
	@# Run on the HOST, not in the container, so the file lands in
	@# cms/src/migrations/ where it can be committed. Reaches Postgres through
	@# the port docker-compose.local.yml exposes.
	cd cms && set -a && . ./local.env && set +a && \
	  DATABASE_URI="postgres://$$DB_USER:$$DB_PASSWORD@localhost:55432/$$DB_DATABASE" \
	  npx payload migrate:create
	@echo ""
	@echo "→ commit the new file in cms/src/migrations/ or the deploy has nothing to apply"

seed: ## Re-run the initial content seed (additive; never overwrites edits)
	cd cms && $(COMPOSE) exec payload npx payload run scripts/seed-initial.ts

seed-admin: ## Create the local admin account only (idempotent)
	cd cms && $(COMPOSE) exec \
	  -e SEED_ADMIN_EMAIL=admin@questlaguna.local \
	  -e SEED_ADMIN_PASSWORD=localdev12345 \
	  payload npx payload run scripts/seed-initial.ts

admin: ## Print the local admin credentials
	@echo "URL:      $(CMS_URL)/admin"
	@echo "Email:    admin@questlaguna.local"
	@echo "Password: localdev12345"
	@echo ""
	@echo "(Local only — production seeds no admin; see cms/WORKFLOW.md)"

optimize-assets: ## Re-optimize the church's raw asset drop into cms/seed/assets
	cd cms && RAW_DIR="$(RAW_DIR)" npx payload run scripts/optimize-seed-assets.ts

## ─── Checks ─────────────────────────────────────────────────────────────

check: ## Type-check the site
	npx astro check

build: ## Production build of the site (uses the CMS if it is running)
	npm run build

test: ## Offline e2e — no CMS needed (26 tests)
	npm run test:e2e

test-cms: ## Integration e2e — boots a real Payload on SQLite (17 tests)
	npm run test:e2e:cms

test-all: check test test-cms ## Everything the CI gates on

clean: ## Remove build output and test artifacts
	rm -rf dist dist-cms dist-local test-results playwright-report .astro
	rm -rf cms/.next cms/media-e2e cms/e2e.db

doctor: ## Check that the local toolchain looks right
	@echo "node    $$(node -v 2>/dev/null || echo 'MISSING — nvm use 22.17.0')"
	@echo "npm     $$(npm -v 2>/dev/null || echo MISSING)"
	@echo "docker  $$(docker --version 2>/dev/null || echo MISSING)"
	@printf "daemon  "; docker ps >/dev/null 2>&1 && echo "ok" || echo "NOT reachable"
	@printf "cms     "; curl -sf -o /dev/null $(CMS_URL)/api/announcements 2>/dev/null && echo "up at $(CMS_URL)" || echo "not running (make cms)"
	@printf "deps    "; test -d node_modules && test -d cms/node_modules && echo "installed" || echo "run: make install"
