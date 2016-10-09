#!/bin/bash

echo will kill the port:$1

for i in `netstat -nltp|awk '{ print $4  " " $7 }'|grep -E ":::$1|0.0.0.0:$1|127.0.0.1:$1}"|awk  '{print $2}'`;

do

echo $i;

index=`expr index $i "/"`;

#echo $index;

pid=${i:0:index-1};

echo $pid;

echo "kill the process named [${i:index}]";

kill -9 $pid

done;