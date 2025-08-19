docker build -t applanding:latest .
docker run -d -p 80:80 --name applanding applanding:latest