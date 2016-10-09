svn update
npm install
./killport.sh 80
outfile=`date +%Y%m%d`".log"
nohup node server.js