containername='SOLMON-COLLECTOR'
docker create --name $containername -e 'SERVICENAME=SOLMON-COLLECTOR' -p 4270:3270 -p 4276:3276 -p 4266:3266 --restart=always slcorp/solmon-collector:1.0 /opt/run.sh
 docker start SOLMON-COLLECTOR

