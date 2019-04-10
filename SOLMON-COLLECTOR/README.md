On a Linux machine, create a work directory (e.g., solmon-collector).

        mkdir solmon-collector

Change directory to it.

        cd solmon-collector

Make a copy of the package that is going to be Dockerized (e.g.,  RTViewDataCollectorSolace).

        cp /source/RTViewDataCollectorSolace_5.0.0.0.zip .

source is the directory, in which, the file originally resides.
Unzip it with the -a option:

        unzip -a RTViewDataCollectorSolace_5.0.0.0.zip

This should create an RTViewDataCollectorSolace directory in your solmon-collector directory.
Copy over the following files:

        cp /source/build_image.sh .
        cp /source/Dockerfile .
        cp /source/install_solmon_collector_to_docker.sh .
        cp /source/run.sh .
        cp /source/setenv.sh .

All 5 files will have to be tailored for the specific RTView package that you are trying to Dockerize.
For example, in the install_solmon_collector_to_docker.sh, the ports, which will have to be forwarded, 
and the directory structure, needed for data persistence, will have to match your installation.
The install script will be named, based on the name of the RTView package.

Build the image:

        . ./build_image.sh

Install and run the image:

        . ./install_solmon_collector_to_docker.sh

Under a successful scenario, at this point, your new Docker container should be running. Do:

        docker ps

To see a list of your running containers.
