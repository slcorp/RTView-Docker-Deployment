export JAVA_HOME=/usr/lib/jvm/java
export PATH=$JAVA_HOME/bin:$PATH

pushd /opt/RTViewDataCollectorSolace/rtvapm
. ./validate_install.sh
cd rtvapm
. ./rtvapm_init.sh
popd


