# RTView DataCollector 4.2 Image
#
FROM centos:7
#RUN yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel && yum clean all
RUN yum install -y java-1.8.0-openjdk && yum clean all
RUN yum install net-tools -y
MAINTAINER SL Corporation
EXPOSE 3276 3266 3270
COPY run.sh /opt/
COPY setenv.sh /opt/
RUN chmod a+x /opt/run.sh
RUN chmod a+x /opt/setenv.sh

RUN mkdir /opt/RTViewDataCollectorSolace
COPY RTViewDataCollectorSolace /opt/RTViewDataCollectorSolace/

ENTRYPOINT ["/opt/run.sh"]

#
#
