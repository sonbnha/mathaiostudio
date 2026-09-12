FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 bubblewrap latexmk texlive-xetex texlive-luatex texlive-latex-extra texlive-science texlive-lang-other biber fonts-noto-core && rm -rf /var/lib/apt/lists/*
RUN useradd --uid 10001 --create-home latex
WORKDIR /app
COPY server.py /app/server.py
USER 10001:10001
ENV LATEX_BIND=0.0.0.0 LATEX_SANDBOX=bubblewrap
EXPOSE 2345
CMD ["python3", "-B", "/app/server.py"]
