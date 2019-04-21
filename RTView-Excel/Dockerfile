FROM node:boron

# Add vim to this image (missing from argon)
COPY tools/vim /usr/bin/

# Create app directory
RUN mkdir -p /usr/src/app/RTView-Excel
WORKDIR /usr/src/app/RTView-Excel

# Install app dependencies
COPY RTView-Excel/package.json /usr/src/app/RTView-Excel
COPY RTView-Excel/rtview_telemetry_connector.js /usr/src/app/RTView-Excel
RUN npm install

COPY run.sh /usr/src/app
RUN chmod a+x /usr/src/app/run.sh

WORKDIR /usr/src/app/RTView-Excel

EXPOSE 8081
ENTRYPOINT ["/usr/src/app/run.sh"]
