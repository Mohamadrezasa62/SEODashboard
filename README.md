# How to run Project
cd backend
python -m venv .venv
cd requirements

docker-compose up -d

py -m pip install -r base.txt
py -m pip install -r development.txt
py -m pip install -r production.txt

py manage.py makemigrations
py manage.py migrate

cd ../frontend
npm install
npm run dev

# open a new terminal and type:
cd ./backend
py manage.py runserver

