#!/bin/bash
# run.sh
> nohup.out
echo "启动Django服务器在 0.0.0.0:8000..."
nohup python3 manage.py runserver 0.0.0.0:8000 &
