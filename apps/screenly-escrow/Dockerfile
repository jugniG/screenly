FROM rust:latest

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)" && \
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

WORKDIR /workspace
COPY . .

CMD ["bash", "docker-deploy.sh"]
