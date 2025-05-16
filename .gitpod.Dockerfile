# .gitpod.Dockerfile
FROM gitpod/workspace-full

# Instala dependências do sistema
RUN sudo apt-get update && \
    sudo apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3.9 \
    python3.9-venv \
    python3-pip \
    nodejs \
    npm

# Instala pnpm
RUN sudo npm install -g pnpm

# Configura ambiente Python
RUN python3.9 -m pip install --upgrade pip && \
    python3.9 -m venv /home/gitpod/.venv-metagpt

# Instala MetaGPT
COPY . /workspace
RUN . /home/gitpod/.venv-metagpt/bin/activate && \
    pip install --no-cache-dir metagpt && \
    echo 'export PATH="/home/gitpod/.venv-metagpt/bin:$PATH"' >> /home/gitpod/.bashrc