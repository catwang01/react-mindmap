FROM python:3.9.15

WORKDIR /app
COPY requirements.txt requirements-dev.txt setup.py .
RUN python setup.py install
COPY . .
CMD python evernoteClient.py
