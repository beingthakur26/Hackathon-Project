echo "### Starting backend.sh ###"

cd "./backend"

source "./venv/bin/activate"
 
uvicorn main:app --host 0.0.0.0 --reload