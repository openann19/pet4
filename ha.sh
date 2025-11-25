#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (sudo)." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="/root/resource-limits-backup-${timestamp}"
mkdir -p "$backup_dir"

backup() {
  local src="$1"
  if [[ -f "$src" ]]; then
    local rel="${src#/}"           # strip leading /
    local dest_dir="${backup_dir}/$(dirname "$rel")"
    mkdir -p "$dest_dir"
    cp -a "$src" "${dest_dir}/"
    echo "Backed up $src -> ${dest_dir}/"
  fi
}

echo "Backups will be stored under: ${backup_dir}"
echo

########################################
# 1. PAM limits (/etc/security)
########################################

for f in /etc/security/limits.conf /etc/security/limits.d/*.conf; do
  [[ -f "$f" ]] || continue
  backup "$f"

  # Comment out all non-comment lines (disable custom limits)
  sed -i -E 's/^([^#].*)$/# RESET_DISABLED \1/' "$f"
  echo "Commented custom limits in $f"
done

########################################
# 2. sysctl limits (/etc/sysctl*)
########################################

reset_sysctl_keys=(
  'fs.file-max'
  'kernel.pid_max'
  'kernel.threads-max'
  'vm.max_map_count'
)

for f in /etc/sysctl.conf /etc/sysctl.d/*.conf; do
  [[ -f "$f" ]] || continue
  backup "$f"

  for key in "${reset_sysctl_keys[@]}"; do
    # Comment out lines that set these specific keys
    sed -i -E "s/^(${key}[[:space:]]*=.*)$/# RESET_DISABLED \1/" "$f"
  done

  echo "Processed sysctl keys in $f"
done

########################################
# 3. systemd limits (/etc/systemd/*.conf)
########################################

for f in /etc/systemd/system.conf /etc/systemd/user.conf; do
  [[ -f "$f" ]] || continue
  backup "$f"

  # Comment out DefaultLimit* lines (process/file limits)
  sed -i -E 's/^(DefaultLimit[[:alnum:]]*[[:space:]]*=.*)$/# RESET_DISABLED \1/' "$f"
  echo "Commented DefaultLimit* in $f"
done

########################################
# 4. User-specific ulimit tweaks
########################################

# Try to infer main user home from SUDO_USER, else skip
user_home=""
if [[ -n "${SUDO_USER-}" && "$SUDO_USER" != "root" ]]; then
  user_home="/home/${SUDO_USER}"
fi

user_files=(
  "/etc/bash.bashrc"
)

if [[ -n "$user_home" ]]; then
  user_files+=(
    "${user_home}/.bashrc"
    "${user_home}/.profile"
  )
fi

for f in "${user_files[@]}"; do
  [[ -f "$f" ]] || continue
  backup "$f"

  # Comment out explicit ulimit lines
  sed -i -E 's/^(ulimit[[:space:]]+-[[:alnum:]]+[[:space:]]+.*)$/# RESET_DISABLED \1/' "$f"

  echo "Commented ulimit lines in $f"
done

echo
echo "Done. All changes are commented out with prefix: RESET_DISABLED"
echo "Backups are in: ${backup_dir}"
echo "Review diffs, then reboot the machine to let defaults take effect."
