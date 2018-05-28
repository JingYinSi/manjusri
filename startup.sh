git pull origin v2.1.0
cnpm install
pm2 stop manjusri2
pm2 start server.js --name manjusri2 --watch -i max