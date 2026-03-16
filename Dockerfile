FROM node:22-bookworm

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    git \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git /opt/emsdk && \
    /opt/emsdk/emsdk install latest && \
    /opt/emsdk/emsdk activate latest

ENV PATH="/opt/emsdk:/opt/emsdk/upstream/emscripten:${PATH}"
ENV EMSDK="/opt/emsdk"

WORKDIR /workspace
