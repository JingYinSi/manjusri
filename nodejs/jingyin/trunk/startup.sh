svn update
npm install --prod
./killport.sh 80
outfile=`date +%Y%m%d`".log"
nohup node server.js &