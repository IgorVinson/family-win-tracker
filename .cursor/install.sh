#!/usr/bin/env bash
# Cloud Agent bootstrap for KidsRise.
# Idempotent. Tools land on the default PATH (/usr/local/bin) and Java is
# exported from /etc/profile.d so non-interactive login shells can see them.
set -euo pipefail

NODE_VERSION="24.21.0"
NODE_SHA256="fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
JAVA_HOME_DIR="/usr/lib/jvm/java-17-openjdk-amd64"

if [[ "$(uname -m)" != "x86_64" ]]; then
  echo "This install script pins the Node.js linux-x64 tarball. Detected $(uname -m)." >&2
  exit 1
fi

if [[ ! -x /usr/local/bin/node ]] || [[ "$(/usr/local/bin/node -p 'process.versions.node')" != "${NODE_VERSION}" ]]; then
  tmp="$(mktemp)"
  curl -fsSL "${NODE_URL}" -o "${tmp}"
  echo "${NODE_SHA256}  ${tmp}" | sha256sum -c -
  sudo tar -xJf "${tmp}" -C /usr/local --strip-components=1 --no-same-owner
  rm -f "${tmp}"
fi

# The Cloud Agent image sources nvm from ~/.bashrc on login shells and
# prepends it to PATH, ahead of /usr/local/bin. Install the same LTS there
# and make it the default so `node` is 24 even when nvm loads.
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  export NVM_DIR="${HOME}/.nvm"
  set +u
  # shellcheck disable=SC1091
  . "${NVM_DIR}/nvm.sh"
  if [[ ! -x "${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/node" ]]; then
    nvm install "${NODE_VERSION}"
  fi
  nvm alias default "${NODE_VERSION}"
  set -u
fi

if [[ ! -x /usr/local/bin/firebase ]]; then
  sudo /usr/local/bin/npm install -g firebase-tools
fi

if [[ ! -x "${JAVA_HOME_DIR}/bin/java" ]]; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openjdk-17-jdk
fi

sudo tee /etc/profile.d/kidsrise-java.sh >/dev/null <<EOF
export JAVA_HOME=${JAVA_HOME_DIR}
export PATH="\$JAVA_HOME/bin:\$PATH"
EOF
sudo chmod 644 /etc/profile.d/kidsrise-java.sh

java17="$(update-alternatives --list java | grep 'java-17' | head -n 1 || true)"
if [[ -n "${java17}" ]]; then
  sudo update-alternatives --set java "${java17}"
fi

if [[ ! -x /usr/local/bin/maestro ]]; then
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  if [[ ! -x "${HOME}/.maestro/bin/maestro" ]]; then
    echo "Maestro installer finished but ${HOME}/.maestro/bin/maestro is missing." >&2
    exit 1
  fi
  sudo ln -sfn "${HOME}/.maestro/bin/maestro" /usr/local/bin/maestro
fi

echo "node $(/usr/local/bin/node -v) (/usr/local/bin/node)"
if [[ -x "${HOME}/.nvm/versions/node/v${NODE_VERSION}/bin/node" ]]; then
  echo "node $(${HOME}/.nvm/versions/node/v${NODE_VERSION}/bin/node -v) (nvm default)"
fi
echo "npm $(/usr/local/bin/npm -v)"
echo "firebase $(/usr/local/bin/firebase --version)"
echo "JAVA_HOME=${JAVA_HOME_DIR}"
"${JAVA_HOME_DIR}/bin/java" -version
/usr/local/bin/maestro --version
