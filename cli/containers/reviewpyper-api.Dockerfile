FROM python:3.11-slim

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    git \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
 && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Calvinwhow/ReviewPyper.git /app/ReviewPyper \
 && if [ ! -f /app/ReviewPyper/__init__.py ]; then touch /app/ReviewPyper/__init__.py; fi

# Fix: textract has a broken dependency spec (extract-msg<=0.29.*)
# Remove textract from requirements and install it separately with relaxed deps
RUN sed -i 's/^textract.*$//' /app/ReviewPyper/requirements.txt \
 && pip install --no-cache-dir -r /app/ReviewPyper/requirements.txt \
 && pip install --no-cache-dir 'extract-msg<=0.29' \
 && pip install --no-cache-dir textract --no-deps \
 && pip install --no-cache-dir fastapi uvicorn[standard]

COPY reviewpyper_api /app/reviewpyper_api

ENV PYTHONPATH=/app/reviewpyper_api:/app
ENV DATA_DIR=/data

RUN mkdir -p /data

WORKDIR /app/reviewpyper_api

EXPOSE 8000

CMD ["uvicorn", "fastapi:app", "--host", "0.0.0.0", "--port", "8000"]
