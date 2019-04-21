containername='RTVIEW-EXCEL'
docker create --name $containername -e 'SERVICENAME=RTVIEW-EXCEL' -p 8081:8081 -v /home/ec2-user/amibase/RTView-Excel-Container/log.txt:/usr/src/app/RTView-Excel/log.txt --restart=always slcorp/rtview-excel:1.0 /usr/src/app/run.sh
 docker start RTVIEW-EXCEL


