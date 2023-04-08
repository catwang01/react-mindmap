docker build -t test . \
    --build-arg "HTTP_PROXY=http://catwang.top:9001/" \
    --build-arg "HTTPS_PROXY=http://catwang.top:9001/" \
    --build-arg "NO_PROXY=localhost,127.0.0.1,catwang.top" 
