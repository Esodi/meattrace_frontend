#!/usr/bin/env bash
# Build the admin dashboard for one environment and publish it to the VPS.
#   ./deploy-admin.sh <staging|dev|demo>
# Asks for the server password twice (scp, then ssh) unless you have SSH keys set up.
# The server side (meattrace-deploy-admin) refuses a build that points at a different environment's API.
set -euo pipefail

ENV_NAME=${1:?usage: ./deploy-admin.sh <staging|dev|demo>}
case "$ENV_NAME" in staging|dev|demo) ;; *) echo "unknown environment: $ENV_NAME" >&2; exit 2 ;; esac

cd "$(dirname "$0")"

# Server address and SSH port are not stored in this (public) repository. Put them in
# deploy-admin.local.env (git-ignored), e.g.:
#   DEPLOY_HOST=203.0.113.10
#   DEPLOY_PORT=22
#   DEPLOY_USER=root
[ -f deploy-admin.local.env ] && . ./deploy-admin.local.env
: "${DEPLOY_HOST:?set DEPLOY_HOST (see deploy-admin.local.env.example)}"
HOST=$DEPLOY_HOST
PORT=${DEPLOY_PORT:-22}
USER_AT=${DEPLOY_USER:-root}

# Build into a separate folder: dist/ is tracked in git and must not be overwritten by deploy builds.
npm run "build:$ENV_NAME" -- --outDir .deploy_dist --emptyOutDir

# Relative path on purpose: GNU tar treats "C:\..." as a remote host on Windows.
TARBALL=".admin_dist_$ENV_NAME.tgz"
trap 'rm -f "$TARBALL"' EXIT
tar -czf "$TARBALL" -C .deploy_dist .

scp -P "$PORT" "$TARBALL" "$USER_AT@$HOST:/root/admin_dist_$ENV_NAME.tgz"
ssh -p "$PORT" "$USER_AT@$HOST" "meattrace-deploy-admin $ENV_NAME /root/admin_dist_$ENV_NAME.tgz; rc=\$?; rm -f /root/admin_dist_$ENV_NAME.tgz; exit \$rc"
