containername='SOLMON-COLLECTOR'
docker create --name $containername -e 'SERVICENAME=SOLMON-COLLECTOR' -p 3270:3270 -p 3276:3276 -p 3266:3266 -v /home/ec2-user/amibase/rtview-server:/opt/RTViewDataCollectorSolace/projects/rtview-server --restart=always slcorp/solmon-collector:1.0 /opt/run.sh
 docker start SOLMON-COLLECTOR

