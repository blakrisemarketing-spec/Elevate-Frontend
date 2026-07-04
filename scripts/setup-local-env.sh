#!/bin/sh
# Wire local dev secrets (.env, .env.local) into a git worktree.
#
# Why: .env/.env.local are gitignored, so `git worktree add` does NOT copy them
# into a new worktree. This keeps ONE canonical copy inside the shared git dir
# (<git-common-dir>/ech-local-env/, never checked out, never committed, chmod
# 600) and symlinks it into each worktree. Edit the secret once, every worktree
# sees it. The post-checkout hook runs this automatically for new worktrees;
# you can also run it by hand: `npm run setup:env` or `sh scripts/setup-local-env.sh`.
#
# Usage: setup-local-env.sh [TARGET_WORKTREE_DIR] [--quiet]
set -eu

FILES=".env .env.local"
QUIET=""
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    *) TARGET="$arg" ;;
  esac
done

say() { [ -n "$QUIET" ] || printf '%s\n' "$*"; }

# Resolve the shared git dir (identical for the main checkout and every worktree).
COMMON=$(git rev-parse --git-common-dir 2>/dev/null) || { say "[setup-env] not a git repo, skipping"; exit 0; }
case "$COMMON" in /*) : ;; *) COMMON="$(cd "$COMMON" && pwd)" ;; esac
CANON="$COMMON/ech-local-env"

# Target worktree defaults to the current one.
[ -n "$TARGET" ] || TARGET=$(git rev-parse --show-toplevel 2>/dev/null) || TARGET="$(pwd)"

mkdir -p "$CANON"
chmod 700 "$CANON" 2>/dev/null || true

linked=0
for f in $FILES; do
  canon="$CANON/$f"
  local="$TARGET/$f"

  # Seed the canonical store from a real file in this worktree the first time.
  if [ ! -e "$canon" ] && [ -f "$local" ] && [ ! -L "$local" ]; then
    cp "$local" "$canon"
    chmod 600 "$canon" 2>/dev/null || true
    say "[setup-env] seeded canonical $f from $TARGET"
  fi

  if [ ! -e "$canon" ]; then
    say "[setup-env] no canonical $f yet (create $canon), skipping"
    continue
  fi
  chmod 600 "$canon" 2>/dev/null || true

  # Already correctly linked? leave it.
  if [ -L "$local" ] && [ "$(readlink "$local")" = "$canon" ]; then
    linked=$((linked + 1))
    continue
  fi

  # Replace whatever is there with a symlink to the canonical file.
  rm -f "$local"
  ln -s "$canon" "$local"
  linked=$((linked + 1))
  say "[setup-env] linked $f -> $canon"
done

say "[setup-env] $linked/2 secret files linked into $TARGET"

# Install the post-checkout hook (idempotent) so FUTURE worktrees auto-link.
# The hook is self-contained: it reads the canonical store directly, so it works
# on any branch even before this script is committed/merged.
HOOK="$COMMON/hooks/post-checkout"
if [ ! -f "$HOOK" ] || ! grep -q 'ech-local-env' "$HOOK" 2>/dev/null; then
  mkdir -p "$COMMON/hooks"
  cat > "$HOOK" <<'HOOK_EOF'
#!/bin/sh
# Auto-link local dev secrets into new worktrees (see scripts/setup-local-env.sh).
top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
common=$(git rev-parse --git-common-dir 2>/dev/null) || exit 0
case "$common" in /*) : ;; *) common=$(cd "$common" 2>/dev/null && pwd) || exit 0 ;; esac
canon="$common/ech-local-env"
for f in .env .env.local; do
  [ -e "$canon/$f" ] || continue
  if [ -L "$top/$f" ]; then
    [ "$(readlink "$top/$f")" = "$canon/$f" ] || { rm -f "$top/$f"; ln -s "$canon/$f" "$top/$f"; }
  elif [ ! -e "$top/$f" ]; then
    ln -s "$canon/$f" "$top/$f"
  fi
done
exit 0
HOOK_EOF
  chmod +x "$HOOK"
  say "[setup-env] installed post-checkout hook -> new worktrees auto-link"
fi
